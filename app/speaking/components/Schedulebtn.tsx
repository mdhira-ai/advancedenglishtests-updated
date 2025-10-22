import { Button } from "@/components/ui/button";

const Schedulebtn = () => {
    return (
        <>
            <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50"
            >
                Schedule
            </Button>
        </>
    );
}

export default Schedulebtn;