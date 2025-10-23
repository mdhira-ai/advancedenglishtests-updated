import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { usePeer } from "@/lib/PeerProvider";

const ConnectBtn = ({ remotePeerId, remoteUserId}: { remotePeerId: string, remoteUserId: string}) => {

    const { data: session } = useSession()
    const { callUser, callState, cancelCall } = usePeer()


    const handleConnect = () => {
        if (remotePeerId && remoteUserId) {
            callUser(remotePeerId, remoteUserId)
        }
    }






    return (
        <>


            {
                callState.isInCall ? null :
                    <Button
                        onClick={handleConnect}
                        type="button"
                        size="sm"
                        // disabled={callState.isRinging}
                        className="w-full h-8 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                       connect
                    </Button>
            }

            {
                callState.isRinging && callState.remoteUserId === remoteUserId &&  (
                    <Button
                        onClick={cancelCall}
                        type="button"
                        size="sm"
                        className="w-full h-8 text-xs font-medium rounded bg-gray-400 text-white cursor-not-allowed"
                    >
                        cancel call  
                    </Button>
                )
            }

        </>
    );
}

export default ConnectBtn;