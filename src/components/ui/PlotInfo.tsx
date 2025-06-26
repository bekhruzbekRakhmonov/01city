'use client';

interface PlotInfoProps {
  isOpen: boolean;
  onClose: () => void;
  buildingInfo: {
    type: string;
    height: number;
    address?: {
      street: string;
      district: string;
      cityCode: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
    companyInfo?: {
      companyName: string;
      website: string;
      logoSvg: string;
      shortDescription: string;
      uploadedAt?: number;
    };
    userId?: string;
    plotId?: string;
    mailbox?: {
      enabled?: boolean;
      address?: string;
    };
  } | null;
  onOpenMailbox?: (plotId: string, plotOwnerId: string | undefined, plotMailboxAddress?: string) => void;
  currentUserId?: string;
}

export function PlotInfo({
  isOpen,
  onClose,
  buildingInfo,
  onOpenMailbox,
  currentUserId
}: PlotInfoProps) {
  console.log('PlotInfo props:', { isOpen, buildingInfo, currentUserId });
  if (!isOpen || !buildingInfo) {
    console.log('PlotInfo not rendering: isOpen =', isOpen, 'buildingInfo =', buildingInfo);
    return null;
  }

  const { companyInfo, address, plotId, mailbox } = buildingInfo;
  const hasCompanyInfo = companyInfo?.companyName;
  const hasAddress = address?.street && address?.cityCode;
  const isOwner = !!(buildingInfo.userId && currentUserId && buildingInfo.userId === currentUserId);
  const canOpenMailbox = isOwner && mailbox?.enabled && onOpenMailbox && plotId;

  const handleWebsiteClick = () => {
    if (companyInfo?.website) {
      const url = companyInfo.website.startsWith('http') 
        ? companyInfo.website 
        : `https://${companyInfo.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Format address for display
  const formatAddress = (addr: { street: string; district: string; cityCode: string; coordinates: { lat: number; lng: number } } | undefined) => {
    if (!addr) return 'No address available';
    return `${addr.street}, ${addr.district}, ${addr.cityCode}`;
  };

  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    if (buildingInfo.address) {
      navigator.clipboard.writeText(formatAddress(buildingInfo.address));
      // You might want to add a toast notification here
    }
  };

  // Copy mailbox address to clipboard - implemented for future use
  // Keeping this function commented out until needed
  /*
  const copyMailboxToClipboard = () => {
    if (buildingInfo.mailbox?.address) {
      navigator.clipboard.writeText(buildingInfo.mailbox.address);
      // You might want to add a toast notification here
    }
  };
  */

  return (
    <div 
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-4 text-white min-w-[280px] max-w-[350px] shadow-lg border border-gray-600 z-[9999] font-sans pointer-events-auto"
      onClick={(e) => {
        e.stopPropagation();
        console.log('PlotInfo clicked');
      }}
    >
      {/* Tooltip Arrow - Removed for fixed positioning */}
      
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('Close button clicked');
          onClose();
        }}
        className="absolute top-2 right-2 bg-transparent border-none text-gray-400 text-base cursor-pointer p-0.5 rounded hover:text-white"
      >
        ×
      </button>

      {/* Building Information */}
      <div className={`${hasCompanyInfo ? 'mb-4' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="m-0 text-base font-bold text-gray-100 flex items-center gap-1.5">
            <span className="text-xl mr-1">🏢</span>
            {buildingInfo.type.charAt(0).toUpperCase() + buildingInfo.type.slice(1)}
          </h3>
          <div className="text-sm text-gray-400 flex gap-1">
            <span>ID: {buildingInfo.plotId?.slice(0, 4)}...{buildingInfo.plotId?.slice(-4)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sm text-gray-300 mb-2">
          <span className="text-gray-400">Height:</span>
          <span>{buildingInfo.height}m</span>
          
          {buildingInfo.address?.coordinates && (
            <>
              <span className="text-gray-400">Location:</span>
              <span>
                {buildingInfo.address.coordinates.lat.toFixed(4)}, {buildingInfo.address.coordinates.lng.toFixed(4)}
              </span>
            </>
          )}
        </div>

        {/* Address Information */}
        {hasAddress && (
          <div className="bg-white bg-opacity-5 rounded-md p-2 my-2 border-l-3 border-blue-500 relative">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <span>📍</span>
                <span>Address</span>
              </div>
              <button 
                onClick={copyAddressToClipboard}
                className="bg-transparent border-none text-gray-400 cursor-pointer px-1 py-0.5 rounded text-xs flex items-center gap-1 transition-all hover:text-white"
              >
                <span>Copy</span>
                <span>📋</span>
              </button>
            </div>
            <div className="text-sm leading-tight break-words">
              <div className="font-medium">{address.street}</div>
              <div className="text-gray-400 text-xs">
                {address.district}, {address.cityCode}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Company Information */}
      {hasCompanyInfo && (
        <div className="border-t border-gray-600 pt-3">
          <div className="text-sm font-bold text-green-500 mb-2">
            {companyInfo.companyName}
          </div>
          
          {companyInfo.shortDescription && (
            <p className="m-0 mb-3 text-gray-300 text-xs leading-relaxed">
              {companyInfo.shortDescription}
            </p>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {companyInfo.website && (
              <button
                onClick={handleWebsiteClick}
                className="bg-blue-500 bg-opacity-10 text-blue-500 border border-blue-500 border-opacity-30 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-all flex items-center gap-1 hover:bg-opacity-20 hover:-translate-y-0.5"
              >
                <span>🌐</span>
                <span>Website</span>
              </button>
            )}
            
            {/* Mailbox Button */}
            {buildingInfo.mailbox?.enabled && (
              <button
                onClick={() => {
                  if (onOpenMailbox && buildingInfo.plotId) {
                    onOpenMailbox(
                      buildingInfo.plotId,
                      buildingInfo.userId,
                      buildingInfo.mailbox?.address
                    );
                  }
                }}
                className="bg-green-500 bg-opacity-10 text-green-500 border border-green-500 border-opacity-30 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-all flex items-center gap-1 hover:bg-opacity-20 hover:-translate-y-0.5"
              >
                <span>📬</span>
                <span>Mailbox</span>
              </button>
            )}
            
            {canOpenMailbox && (
              <button
                onClick={() => onOpenMailbox(plotId!, buildingInfo.userId!, mailbox?.address)}
                className="bg-green-500 text-white border-none rounded px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors hover:bg-green-600"
              >
                View Mailbox
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}