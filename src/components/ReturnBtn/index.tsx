import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const ReturnBtn = ({href, btnText}: {href: string, btnText: string}) => {
    return (
        <Link href={href} className="inline-flex items-center gap-2 text-[#7F4B30] hover:text-[#F3E2C7]">
            <ArrowLeftIcon className="h-4 w-4" />
            <span>{btnText}</span>
        </Link>
    );
};

export default ReturnBtn;