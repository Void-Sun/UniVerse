import Image from "next/image";
import { useState } from "react";

export default function Chat({ onClick, active, data }: any) {
    const [text, setText] = useState(data.description);

    return (
        <div className={`${active ? 'bg-[#735fa5a4]' : ''}  flex items-center flex-col`} onClick={onClick}>
            <div className="flex items-center w-full h-[4rem] justify-between hover:bg-[#40345da4] hover:rounded-[0.2rem] transition-colors ease-in-out duration-150 hover:cursor-pointer p-5">
                <div className="w-full overflow-hidden whitespace-nowrap text-overflow">
                    <p className="text-white text-xl">{data.title}</p>
                    <p className="text-opacity-60 text-white text-sm">{text.length > 30 ? text.substring(0, 30) + '...' : text}</p>
                </div>
                <div className="flex h-full pt-2 pr-2 ">
                    <p className="text-white"></p>
                </div>
            </div>
            <hr className="w-[90%] border-[#9b8eb967] " />
        </div>
    );
}
