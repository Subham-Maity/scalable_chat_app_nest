"use client"
import {useRouter} from "next/navigation";

export default function Home() {
    const router = useRouter()
    const handleSSE = () => {
        router.push('/chat')
    }
  return (
      <div className="bg-gradient-to-r from-gray-700 via-gray-900 to-black h-screen flex justify-center items-center gap-2">
        <button type="button"
                className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700" onClick={handleSSE} >CHAT HERE
        </button>
      </div>
  );
}
