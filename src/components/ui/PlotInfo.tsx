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
      <div style={{ marginBottom: hasCompanyInfo ? '16px' : '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '1.2em', marginRight: '4px' }}>🏢</span>
            {buildingInfo.type.charAt(0).toUpperCase() + buildingInfo.type.slice(1)}
          </h3>
          {/* <div style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', gap: '4px' }}>
            <span>ID: {buildingInfo.plotId?.slice(0, 4)}...{buildingInfo.plotId?.slice(-4)}</span>
          </div> */}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '4px 8px',
          fontSize: '13px',
          color: '#d1d5db',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#9ca3af' }}>Height:</span>
          <span>{buildingInfo.height}m</span>

          {buildingInfo.address?.coordinates && (
            <>
              <span style={{ color: '#9ca3af' }}>Location:</span>
              <span>
                {buildingInfo.address.coordinates.lat.toFixed(4)}, {buildingInfo.address.coordinates.lng.toFixed(4)}
              </span>
            </>
          )}
        </div>

        {/* Address Information */}
        {hasAddress && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            padding: '8px 12px',
            margin: '8px 0',
            borderLeft: '3px solid #3b82f6',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#9ca3af',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <span>📍</span>
                <span>Address</span>
              </div>
              <button
                onClick={copyAddressToClipboard}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <span>Copy</span>
                <span>📋</span>
              </button>
            </div>
            <div style={{
              fontSize: '13px',
              lineHeight: '1.4',
              wordBreak: 'break-word'
            }}>
              <div style={{ fontWeight: 500 }}>{address.street}</div>
              <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                {address.district}, {address.cityCode}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Company Information */}
      {hasCompanyInfo && (
        <div style={{
          borderTop: '1px solid #374151',
          paddingTop: '12px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#10b981',
            marginBottom: '8px'
          }}>
            {companyInfo.companyName}
          </div>

          {companyInfo.shortDescription && (
            <p style={{
              margin: '0 0 12px 0',
              color: '#d1d5db',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              {companyInfo.shortDescription}
            </p>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {companyInfo.website && (
              <button
                onClick={handleWebsiteClick}
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseOver={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                  target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  target.style.transform = 'translateY(0)';
                }}
              >
                <span>🌐</span>
                <span>Website</span>
              </button>
            )}

            {/* Mailbox Button */}
            {buildingInfo.mailbox?.enabled && (
              <button
                onClick={() => {
                  console.log(onOpenMailbox, buildingInfo.plotId)
                  if (onOpenMailbox && buildingInfo.plotId) {
                    onOpenMailbox(
                      buildingInfo.plotId,
                      buildingInfo.userId,
                      buildingInfo.mailbox?.address
                    );
                  }
                }}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseOver={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                  target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                  target.style.transform = 'translateY(0)';
                }}
              >
                <span>📬</span>
                <span>Mailbox</span>
              </button>
            )}

            {canOpenMailbox && (
              <button
                onClick={() => onOpenMailbox(plotId!, buildingInfo.userId!, mailbox?.address)}
                style={{
                  backgroundColor: '#10b981', // Green color for mailbox
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
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