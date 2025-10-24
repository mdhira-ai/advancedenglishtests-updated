import ScheduleDialogBox from "@/components/ScheduleDialog/ScheduleDialogBox";
import { UsersData } from "@/lib/SpeakingPageProvider";

const Schedulebtn = ({ userDetails }: { userDetails: UsersData }) => {
    return (
        <>
        
            <ScheduleDialogBox userDetails={userDetails} />
        </>
    );
}

export default Schedulebtn;