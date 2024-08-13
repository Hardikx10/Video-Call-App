import { useEffect, useRef, useState } from "react";

import { Socket, io } from "socket.io-client";
import { UserManager } from "./../../../backend/src/managers/UserManger";

const URL = "https://videocall-backend-webrtc-08416685aa78.herokuapp.com/";

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack
}: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
}) => {
   
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<null | Socket | any>(null);
    const [, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const [roomID,setroomid]=useState("")
    useEffect(() => {
        const socket = io(URL);
        socket.on('send-offer', async ({roomId}) => {
            console.log("sending offer");
            setLobby(false);
            const pc = new RTCPeerConnection();

            setSendingPc(pc);
            setroomid(roomId)
            if (localVideoTrack) {
                console.log("added Video track");
                console.log(localVideoTrack)
                pc.addTrack(localVideoTrack)
            }
            if (localAudioTrack) {
                console.log("added audio track");
                console.log(localAudioTrack)
                pc.addTrack(localAudioTrack)
            }

            pc.onicecandidate = async (e) => {
                console.log("receiving ice candidate locally");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "sender",
                    roomId
                   })
                }
            }

            pc.onnegotiationneeded = async () => {
                console.log("on negotiation neeeded, sending offer");
                const sdp = await pc.createOffer();
                //@ts-ignore
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp,
                    roomId
                })
            }
        });

        socket.on('deleting-room',async({roomID})=>{
        
            console.log("deleting room "+roomID);
            // setLobby(true)
           
            // window.location.reload();
        })

        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            console.log("received offer");
            setLobby(false);
            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer();
            //@ts-ignore
            pc.setLocalDescription(sdp)
            const stream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }

            setRemoteMediaStream(stream);
            // trickle ice 
            setReceivingPc(pc);
            // window.pcr = pc;
            pc.onicecandidate = async (e) => {
                if (!e.candidate) {
                    return;
                }
                console.log("ice candidate on receiving side");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "receiver",
                    roomId
                   })
                }
            }

            socket.emit("answer", {
                roomId,
                sdp: sdp
            });
            setTimeout(() => {
                console.log("inside set timeout");
                
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                console.log(track1);
                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2)
                    setRemoteVideoTrack(track1)
                } else {
                    setRemoteAudioTrack(track1)
                    setRemoteVideoTrack(track2)
                }
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track1)
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track2)
                //@ts-ignore
                remoteVideoRef.current.play();
                
            }, 500)
        });

        socket.on("answer", ({sdp: remoteSdp}) => {
            setLobby(false);
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc;
            });
            console.log("loop closed");
        })

        socket.on("lobby", () => {
            setLobby(true);
        })

        socket.on("add-ice-candidate", ({candidate, type}) => {
            console.log("add ice candidate from remote");
            console.log({candidate, type})
            if (type == "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.log("receiving pc nout found")
                    } else {
                        console.log(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            } else {
                setSendingPc(pc => {
                    if (!pc) {
                        console.log("sending pc nout found")
                    } else {
                        // console.log(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            }
        })

        setSocket(socket)




    }, [name])

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    }, [localVideoRef])


    return (
        <div className="relative w-full h-screen bg-gray-900">
          {lobby ? (
            <div className="absolute top-0 left-0 font-bold w-full h-full flex justify-center items-center text-2xl text-gray-600">
              Connecting...
            </div>
          ) : (
            <video
              className="absolute top-0 left-0 w-full h-[70%] md:w-[70%] md:h-[95%] object-cover rounded-md border-2 border-gray-300"
              autoPlay
              ref={remoteVideoRef}
            />
          )}
          <div className="absolute bottom-4 right-4 h-[30%] md:w-96 md:h-80 bg-gray-800 rounded-md p-1">
            <video
              className="w-full h-full object-cover rounded-md border-2 border-gray-300"
              autoPlay
              ref={localVideoRef}
            />
          </div>
          {lobby?<></> :<button
            onClick={() => {
              socket?.emit('deleting-room', {
                roomID
              });
             UserManager.prototype.addUser("randomName",socket)
             
              
            //   setLobby(true)
            //   window.location.reload();
            }}
            className="absolute right-4 md:right-8 lg:right-30 bottom-[35%] md:bottom-[40%] lg:bottom-[50%] px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-800"
          >
            Next
          </button>}
        </div>
      );
      

}