import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, X, Copy, Check, QrCode as QrIcon } from 'lucide-react';
import './QrCodeModal.css';

export default function QrCodeModal({ isOpen, onClose, url, shortCode }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url || !isOpen) return;

    QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0B0F19',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUri) => {
        setQrDataUrl(dataUri);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
  }, [url, isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr_${shortCode || 'shortlink'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qr-modal-header">
          <div className="qr-title-wrap">
            <div className="qr-icon-pill">
              <QrIcon size={18} />
            </div>
            <div>
              <h3 className="qr-modal-title">QR Code</h3>
              <p className="qr-modal-sub">Scan with any smartphone or download image</p>
            </div>
          </div>
          <button type="button" className="qr-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* QR Display */}
        <div className="qr-code-canvas-wrap">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR Code for ${url}`} className="qr-code-img" />
          ) : (
            <div className="qr-loading">Generating QR code...</div>
          )}
        </div>

        {/* URL Preview */}
        <div className="qr-url-pill">
          <span className="qr-url-text" title={url}>{url}</span>
          <button 
            type="button" 
            className={`qr-url-copy-btn ${copied ? 'copied' : ''}`} 
            onClick={handleCopyLink}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="qr-modal-actions">
          <button type="button" className="qr-btn-download" onClick={handleDownload} disabled={!qrDataUrl}>
            <Download size={16} />
            <span>Download High-Res PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
