import React, { useEffect, useRef, useState } from 'react'
import './chat.css'
import EmojiPicker from 'emoji-picker-react'
import { arrayUnion, doc,onSnapshot,updateDoc, getDoc } from 'firebase/firestore';
import {db} from '../../lib/firebase';
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import upload from '../../lib/upload';
import { TUICallKit, TUICallKitServer, TUICallType } from "@tencentcloud/call-uikit-react";
import * as GenerateTestUserSig from "../../debug/GenerateTestUserSig-es"; // Refer to Step 3



const Chat=()=> {
  const [chat,setChat]=useState();
  const [open,setopen]=useState(false);
  const [text,setText]=useState("");
  const {chatId,user,isCurrentUserBlocked,isReceiverBlocked}=useChatStore();
  const {currentUser}=useUserStore();
  const [img,setImg]=useState({
     file:null,
     url:"",
  });

  const endRef=useRef(null);
  
  
  useEffect(()=>{
    endRef.current?.scrollIntoView({behavior: 'smooth'});
  },[]);

  useEffect(()=>{
    const unSub=onSnapshot(doc(db,'chats',chatId),(res)=>{
      setChat(res.data());
      setCallerUserID(user.id);
      setCalleeUserID(currentUser.id);
    })
    return ()=>{
      unSub();
    }
  },[chatId])

  const SDKAppID = 20010795;        // TODO: Replace with your SDKAppID (Notice: SDKAppID is of type number）
  const SDKSecretKey = 'ce8d6987fe0f61b0dbd240ed2e665af6123c5a65759f96c06b46492179a47cdf';   // TODO: Replace with your SDKSecretKey
  
  const [callerUserID, setCallerUserID] = useState('');
  const [calleeUserID, setCalleeUserID] = useState('');
    
  //【1】Initialize the TUICallKit component
  const init = async () => {
    const { userSig } = GenerateTestUserSig.genTestUserSig({ 
      userID: callerUserID,
      SDKAppID,
      SecretKey: SDKSecretKey,
    });
    await TUICallKitServer.init({
      userID: callerUserID,
      userSig,
      SDKAppID,
    });
    alert('TUICallKit init succeed');
  }
  //【3】Make a 1v1 video call
const call = async () => {
  await TUICallKitServer.call({
    userID: calleeUserID,
    type: TUICallType.VIDEO_CALL,
  });
};
const voicecall = async () => {
  try {
    const enable = true;
    await TUICallKitServer.enableFloatWindow(enable);
  } catch (error) {
    console.error(`[TUICallKit] Failed to call the enableFloatWindow API. Reason: ${error}`);
  }
  
   const enable = true;
   TUICallKitServer.enableVirtualBackground(enable);

  await TUICallKitServer.call({
    userID: calleeUserID,
    type: TUICallType.AUDIO_CALL,
  });
};
const fun1=async()=>{
  init()
  voicecall()
}
const fun2=async()=>{
  init()
  call()
}

  const handleEmoji=(e)=>{
        console.log(e);
         setText((prev)=>prev+e.emoji);
  }
  const handleImg=(e)=>{
    if(e.target.files[0]){
    setImg({
      file:e.target.files[0],
      url:URL.createObjectURL(e.target.files[0])
    })
    }
  }
  console.log(text);

  const handleSend=async()=>{
    if(text==="")return;
    

    let imgUrl=null;

    try {
      if(img.file){
        imgUrl=await upload (img.file);
      }
      await updateDoc(doc(db,'chats',chatId),{
        message:arrayUnion({
          senderId:currentUser.id,
          text,
          createdAt:new Date(),
          ...(imgUrl && {img:imgUrl})
        }),
      });
      
      const userIDs=[currentUser.id,user.id];
      userIDs.forEach(async (id)=>{
      const userChatsRef=doc(db,"userchats",id);
      const userChatsSnapshot=await getDoc(userChatsRef);
      
      if(userChatsSnapshot.exists()){
        const userChatsData=userChatsSnapshot.data();

        const chatIndex=userChatsData.chats.findIndex(
          (c)=>c.chatId === chatId
        );

        userChatsData.chats[chatIndex].lastMessage = text;
        userChatsData.chats[chatIndex].isSeen = id===currentUser.id ? true : false;
        userChatsData.chats[chatIndex].updatedAt = Date.now();

        await updateDoc(userChatsRef,{
          chats:userChatsData.chats,
        });
      }
      })
      
    } catch (error) {
       console.log(error);
    }

    setImg({
      file:null,
      url:""
    });
    setText("");
  }
  return (
    <div className='chat'>
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>{user?.status}</p>
          </div>
        </div>
        <div className="icons">
          <img onClick={fun1} src="./phone.png" alt="" />
          <img onClick={fun2}  src="video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      <div className="center">
        {chat?.message?.map((message)=>(
        <div className={message.senderId===currentUser?.id ? "message own" : "message"} key={message?.createAt}>
          <div className="texts">
            {message.img && <img src={message.img} alt="" />}
            <p>{message.text}</p>
          </div>
        </div>))}
        {img.url && 
        <div className="message own">
          <div className="texts">
            <img src={img.url} alt="" />
          </div>
        </div>
        }
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
          <img src="./img.png" alt="" />
          </label>
          <input type="file"  id="file" style={{display:"none"}} onChange={handleImg}/>
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input type="text" value={text} placeholder='Type your message...' onChange={(e)=>setText(e.target.value)} disabled={isCurrentUserBlocked || isReceiverBlocked}/>
        <div className="emoji">
          <img src="./emoji.png" alt="" onClick={()=>setopen((prev)=>!prev)}/>
          <div className="picker">
          <EmojiPicker open={open} onEmojiClick={handleEmoji}/>
          </div>
        </div>
        <button className='sendButton' onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>send</button>
      </div>
      <div className='call'>
        <TUICallKit/>
        </div>
    </div>
  )
}

export default Chat