import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

const ReturnBtn = ({href, btnText, className}: {href: string, btnText: string, className?: string}) => {
    return (
        <Link href={href} className={clsx("inline-flex items-center gap-2 text-[#7F4B30] hover:text-[#F3E2C7]", className)}>
            <ArrowLeftIcon className="h-4 w-4" />
            <span>{btnText}</span>
        </Link>
    );
};

export default ReturnBtn;