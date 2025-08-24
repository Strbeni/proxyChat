import { useState, useEffect, useRef } from 'react';
import { createClient, type Session, type RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
type ChatMessage = {
  message: string;
  user_name?: string;
  avatar?: string;
  timestamp: string;
};

function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [userOnline, setUserOnline] = useState<string[]>([]);
    const [joined, setJoined] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    
    const chatContainerRef = useRef(null);
    const scroll = useRef();

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      return () => subscription.unsubscribe();
    }, [])

    // console.log(session);

    
    //signin
    const signIn = async ()=>{
        await supabase.auth.signInWithOAuth({
            provider:'google',
        })
    }

    const signOut = async () => {
        await supabase.auth.signOut();
    }

    useEffect(()=>{

        if(!session?.user){
            setUserOnline([]);
            return;
        }

        const roomOne = supabase.channel("room_one",{
            config:{
                broadcast: { self: true },
                presence: {
                    key:session?.user?.id,
                },
            },
        })
        channelRef.current = roomOne;

        roomOne.on("broadcast", {event: "message"}, (payload)=>{
            setMessages((prevMessages)=> {
                const updatedMessages = [...prevMessages, payload.payload as ChatMessage];
                // console.log('New message received:', payload.payload);
                // console.log('All messages:', updatedMessages);
                return updatedMessages;
            });
        });

        roomOne.subscribe(async(status)=>{
            // console.log('Channel subscribe status:', status);
            if(status == "SUBSCRIBED"){
                await roomOne.track({
                    id:session?.user?.id,
                });
                setJoined(true);
            }
        });


        roomOne.on("presence", {event:'sync'}, ()=>{
            const state = roomOne.presenceState();
            setUserOnline(Object.keys(state));
        })

        return () => {
            roomOne.unsubscribe();
            channelRef.current = null;
            setJoined(false);
        };
    
    }, [session]);


    const sendMessage = async (e: React.FormEvent) =>{
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (!channelRef.current) return;
        if (!joined) {
          console.warn('Channel not joined yet. Please wait a moment and try again.');
          return;
        }

        const ok = await channelRef.current.send({
            type:"broadcast",
            event:"message",
            payload:{
                message:newMessage,
                user_name: session?.user?.user_metadata?.email,
                // avatar: (session?.user?.user_metadata as any)?.avatar || (session?.user?.user_metadata as any)?.avatar_url,
                avatar:session?.user?.user_metadata?.avatar_url,
                timestamp: new Date().toISOString(),
            } satisfies ChatMessage,
        });
        if (!ok) {
          console.error('Failed to send message');
          return;
        }
        setNewMessage("");
    };


    const formatTime = (isoString)=>{
        return new Date(isoString).toLocaleTimeString("en-us",{
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
    }

    useEffect(()=>{
        setTimeout(()=>{
            if(chatContainerRef.current)
                chatContainerRef.current.scrollTOp = chatContainerRef.current.scrollHeight;
        },100);

    },[messages])

    if(!session?.user){
        return (
            <div className='w-full flex h-screen justify-center items-center'>
                <button onClick={signIn}>Signin with Google to chat</button>
            </div>
        )
    }else{
        return(<>
    <div className='w-full flex h-screen justify-center items-center p-4'>
      <div className='border-[1px] border-gray-700 max-w-6xl  w-full min-h-[600px] rounded-lg'>
        {/* Header */}
      <div className='flex justify-between h-20 border-b-[1px]  text-slate-200 w-full pl-4 rounded-tl-lg rounded-tr-lg'>
        <div className='p-4'>
          <p className='text-gray-300'>Signed in as {session?.user?.user_metadata?.full_name}</p>
          <p className='text-gray- italic text-sm'>{userOnline.length} user(s) online</p>
        </div>
        <button className='m-2 sm:mr-4' onClick={signOut}>Signout</button>
      </div>
    {/* Main chat */}
        <div ref={chatContainerRef} 
        className='p-4 flex flex-col overflow-y-auto h-[500px]'>

            {messages.map((msg, idx) => (
                <div key={idx} className={`my-2 flex w-full items-start ${msg?.user_name == session?.user?.email ? "justify-end" : "justify-start"}`}>
                        {/* Recieved message -avatar on left */}

                        {/* {msg.user_name == session?.user?.email && (
                        )} */}
                      
                      <div className='flex flex-col w-full'>
                        <div className={`p-1 max-w-[70%] rounded-xl px-4 py-1.5 ${msg?.user_name == session?.user?.email ? "bg-gray-700 text-white ml-auto": "bg-gray-500 text-white mr-auto"}`}>
                            <p key={`${msg.timestamp}-${idx}`}>{msg.message}</p>
                        </div>
                        
                        {/* timestamp */}
                        <div className={`text-xs opacity-75 pt-1 ${msg?.user_name == session.user.email ? "text-right mr-2": "text-left ml-2"}`}>
                            {formatTime(msg?.timestamp)}
                        </div>
                      </div>

                      {msg?.user_name === session.user.email && (
                            <img src={msg.avatar} alt="img" className='w-10 h-10 rounded-full ml-2'/>
                      )}
                </div>
            ))}
        </div>

            {/* Message Input */}
        <form onSubmit={sendMessage} className='flex flex-col sm:flex-row p-3 border-t-[1px] border-gray-700'>

            <input 
                value ={newMessage}
                onChange={(e)=>setNewMessage(e.target.value)}
                type="text" 
                placeholder='Type a message....' 
                className='p-2 w-full bg-[#00000040] rounded-lg'/>

            <button className='mt-4 sm:mt-0 sm:ml-8 text-white max-h-12'>
              Send
            </button>
            <span ref={scroll}></span>
        </form>
      </div>
    </div>
    </>)};
}

export default App
