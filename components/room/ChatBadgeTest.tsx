// Test component to verify chat notification badges are working
// Place this in a test room to verify the fix

import React from 'react'

const ChatBadgeTest = () => {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-semibold text-yellow-800 mb-2">Chat Badge Test Instructions</h3>
      <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
        <li>Have two users (A and B) join the same speaking room</li>
        <li>User A keeps chat closed, User B opens chat</li>
        <li>User B sends a message to group chat</li>
        <li>User A should see red badge on chat button with "1" count</li>
        <li>User B sends a private message to User A</li>
        <li>User A badge should now show "2" (1 group + 1 private)</li>
        <li>User A opens chat - badge should disappear after viewing messages</li>
        <li>User A opens private tab - private message badge should disappear</li>
      </ol>
      <div className="mt-2 text-xs text-yellow-600">
        ✅ If badges show and disappear correctly, the fix is working!
      </div>
    </div>
  )
}

export default ChatBadgeTest
