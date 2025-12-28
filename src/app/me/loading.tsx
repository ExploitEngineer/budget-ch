import { LoaderCircleIcon } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <LoaderCircleIcon className="animate-spin" size={24} />
        </div>
    )
}