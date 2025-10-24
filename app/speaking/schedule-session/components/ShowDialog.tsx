import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ShowDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionData: {
    id: string;
    title: string;
    status: string;
    description: string;
    startTime: Date;
    isBooker: boolean;
    participantId: string;
    bookerId: string;
  } | null;
}

const ShowDialog = ({ isOpen, onOpenChange, sessionData }: ShowDialogProps) => {
    if (!sessionData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Session Details</DialogTitle>
                    <DialogDescription>
                        Details for your speaking session
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="font-semibold">Title:</label>
                        <p>{sessionData.title}</p>
                    </div>
                    <div>
                        <label className="font-semibold">Status:</label>
                        <p className="capitalize">{sessionData.status}</p>
                    </div>
                    <div>
                        <label className="font-semibold">Start Time:</label>
                        <p>{sessionData.startTime?.toLocaleString()}</p>
                    </div>
                    <div>
                        <label className="font-semibold">Role:</label>
                        <p>{sessionData.isBooker ? 'You booked this session' : 'You are participating'}</p>
                    </div>
                    {sessionData.description && (
                        <div>
                            <label className="font-semibold">Description:</label>
                            <p>{sessionData.description}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ShowDialog;