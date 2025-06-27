'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface MailMessage {
  _id: Id<'mailMessages'>;
  subject: string;
  senderDisplayName: string;
  timestamp: number;
  isRead: boolean;
  body: string;
  recipientPlotAddress: string;
  // Add other message fields as needed
}

interface MailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  plotId: Id<'plots'>;
  plotOwnerId?: string; // To check if current user is owner
  plotMailboxAddress?: string; // Display the mailbox address
  onMessageRead?: () => void; // Callback when a message is read
}

export function MailboxModal({ 
  isOpen, 
  onClose, 
  plotId, 
  plotOwnerId, 
  plotMailboxAddress,
  onMessageRead, 
}: MailboxModalProps) {
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  const { user } = useUser();
  const currentUserId = user?.id;
  const isOwner = currentUserId === plotOwnerId;

  const messages = useQuery(api.mail.getMessagesForPlot, 
    plotId ? { plotId, paginationOpts: { numItems: 10, cursor: null } } : 'skip');
  
  const unreadCount = useQuery(api.mail.getUnreadMessageCount, plotId ? { plotId } : 'skip');
  
  const markAsRead = useMutation(api.mail.markMessageAsRead);
  const deleteMsg = useMutation(api.mail.deleteMessage);
  // Temporarily comment out markAllAsRead as it's not defined in the API
  // const markAllAsRead = useMutation(api.mail.markAllAsRead);

  // Copy mailbox address to clipboard
  const copyMailboxAddress = () => {
    if (plotMailboxAddress) {
      navigator.clipboard.writeText(plotMailboxAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (!plotId || !messages) return;
    
    try {
      setIsMarkingRead(true);
      // Mark each message as read individually
      await Promise.all(
        messages.page
          .filter(msg => !msg.isRead)
          .map(msg => markAsRead({ messageId: msg._id }))
      );
      // Notify parent component that messages were read
      onMessageRead?.();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  // Handle message selection
  const handleSelectMessage = async (message: MailMessage) => {
    setSelectedMessage(message);
    
    // Mark as read if unread
    if (!message.isRead) {
      try {
        await markAsRead({ messageId: message._id });
        // Notify parent component that a message was read
        onMessageRead?.();
      } catch (error) {
        console.error("Failed to mark message as read:", error);
      }
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: Id<'mailMessages'>) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    
    try {
      setIsDeleting(true);
      await deleteMsg({ messageId });
      setSelectedMessage(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Close modal and reset state
  const handleClose = () => {
    setSelectedMessage(null);
    onClose();
  };

  if (!isOpen || !plotId) return null;

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-gray-800 text-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div>
            <div className="text-xl font-bold">Mailbox</div>
            {plotMailboxAddress && (
              <div className="flex items-center mt-1 text-sm text-gray-400">
                <span className="mr-2">📭 {plotMailboxAddress}</span>
                <button 
                  onClick={copyMailboxAddress}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded flex items-center"
                  title="Copy mailbox address"
                >
                  {copiedAddress ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {unreadCount !== undefined && unreadCount > 0 && (
              <div className="flex items-center">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount} unread
                </span>
                {isOwner && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingRead}
                    className="ml-2 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
                  >
                    {isMarkingRead ? 'Marking...' : 'Mark all as read'}
                  </button>
                )}
              </div>
            )}
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Message List */}
          <div className="w-2/5 border-r border-gray-700 overflow-y-auto">
            {messages?.page && messages.page.length > 0 ? (
              <div className="divide-y divide-gray-700">
                {messages.page.map((msg) => (
                  <div 
                    key={msg._id}
                    onClick={() => handleSelectMessage(msg as MailMessage)}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedMessage?._id === msg._id 
                        ? 'bg-gray-700' 
                        : msg.isRead ? 'hover:bg-gray-750' : 'bg-gray-800 hover:bg-gray-750'
                    } ${!msg.isRead ? 'border-l-4 border-green-400' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`font-medium ${msg.isRead ? 'text-gray-300' : 'text-white'}`}>
                        {msg.subject || '(No subject)'}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      From: {msg.senderDisplayName || 'Unknown Sender'}
                    </p>
                    {!msg.isRead && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                        New
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>No messages yet</p>
                <p className="text-sm mt-2">Your mailbox is empty</p>
              </div>
            )}
          </div>

          {/* Message Detail View */}
          <div className="flex-1 overflow-y-auto">
            {selectedMessage ? (
              <div className="h-full flex flex-col">
                {/* Message Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="text-xl font-bold text-white">
                      {selectedMessage.subject || '(No subject)'}
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteMessage(selectedMessage._id)}
                        disabled={isDeleting}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center"
                        title="Delete message"
                      >
                        {isDeleting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-300 space-y-1">
                    <p><span className="text-gray-400">From:</span> {selectedMessage.senderDisplayName || 'Unknown Sender'}</p>
                    <p><span className="text-gray-400">To:</span> {selectedMessage.recipientPlotAddress || 'N/A'}</p>
                    <p><span className="text-gray-400">Date:</span> {formatDate(selectedMessage.timestamp)}</p>
                  </div>
                </div>
                
                {/* Message Body */}
                <div 
                  className="flex-1 p-6 overflow-y-auto prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedMessage.body 
                      ? selectedMessage.body.replace(/\n/g, '<br />')
                      : '<p class="text-gray-400">No content</p>'
                  }}
                />
                
                {/* Message Actions */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        // TODO: Implement reply functionality
                        alert('Reply functionality coming soon!');
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Reply
                    </button>
                    {!isOwner && (
                      <button
                        onClick={() => {
                          // TODO: Implement report functionality
                          alert('Report functionality coming soon!');
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="text-lg font-medium text-gray-300">Select a message</div>
                <p className="mt-1">Choose a message to read it here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default MailboxModal;