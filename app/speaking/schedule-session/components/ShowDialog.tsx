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

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
            case 'completed':
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case 'cancelled':
                return "bg-red-50 text-red-700 border-red-200";
            case 'pending':
                return "bg-amber-50 text-amber-700 border-amber-200";
            case 'scheduled':
                return "bg-blue-50 text-blue-700 border-blue-200";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] p-0">
                <div className="px-6 pt-6 pb-2">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold tracking-tight">Session Details</DialogTitle>
                        <DialogDescription className="text-base">
                            Comprehensive information about your speaking session
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="border-t" />
                
                <div className="px-6 py-5 space-y-5">
                    {/* Title Section */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="text-sm font-semibold text-foreground uppercase tracking-wide">Title</label>
                        </div>
                        <div className="col-span-2">
                            <p className="text-base font-medium text-foreground">{sessionData.title}</p>
                        </div>
                    </div>

                    <div className="border-t opacity-50" />

                    {/* Status Section */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="text-sm font-semibold text-foreground uppercase tracking-wide">Status</label>
                        </div>
                        <div className="col-span-2">
                            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-sm font-semibold border capitalize ${getStatusStyle(sessionData.status)}`}>
                                {sessionData.status}
                            </span>
                        </div>
                    </div>

                    <div className="border-t opacity-50" />

                    {/* Date & Time Section */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="text-sm font-semibold text-foreground uppercase tracking-wide">Date & Time</label>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <p className="text-base font-medium text-foreground">
                                {sessionData.startTime?.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium">
                                {sessionData.startTime?.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="border-t opacity-50" />

                    {/* Role Section */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="text-sm font-semibold text-foreground uppercase tracking-wide">Your Role</label>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <p className="text-base font-medium text-foreground">
                                {sessionData.isBooker ? 'Session Organizer' : 'Participant'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {sessionData.isBooker ? 'You created and manage this session' : 'You are enrolled in this session'}
                            </p>
                        </div>
                    </div>

                    {/* Description Section */}
                    {sessionData.description && (
                        <>
                            <div className="border-t opacity-50" />
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="text-sm font-semibold text-foreground uppercase tracking-wide">Description</label>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed">{sessionData.description}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="border-t" />

                {/* Footer */}
                <div className="px-6 py-4 bg-muted/30">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Session ID</span>
                        <span className="font-mono text-muted-foreground bg-background px-2 py-1 rounded border">{sessionData.id}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ShowDialog;