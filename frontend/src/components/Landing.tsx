import { useEffect, useRef, useState } from "react"

import { Room } from "./Room";

export const Landing = () => {
    const name = "";
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [joined, setJoined] = useState(false);

    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        // MediaStream
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]
        setLocalAudioTrack(audioTrack);
        setlocalVideoTrack(videoTrack);
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])
        videoRef.current.play();
        // MediaStream
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam()
        }
    }, [videoRef]);

    if (!joined) {
            
        return (
            <div className="bg-gray-900 h-screen flex flex-col items-center justify-center">
                <video
                    className="w-11/12 h-19 md:w-3/4 lg:w-1/2 h-auto rounded-md border-2 border-gray-300 mb-4"
                    autoPlay
                    ref={videoRef}
                ></video>
                <div className="w-20">
                    <button
                        className="bg-sky-700 text-white text-xl font-bold py-3 px-9 rounded hover:bg-sky-900 transition duration-300"
                        onClick={() => {
                            setJoined(true);
                        }}
                    >
                        Join
                    </button>
                </div>
            </div>
        );
    }        

    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />
}