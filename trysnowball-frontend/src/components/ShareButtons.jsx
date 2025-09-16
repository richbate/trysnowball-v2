import React from 'react';
import {
  TwitterShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  TwitterIcon,
  FacebookIcon,
  LinkedinIcon,
  WhatsappIcon,
} from 'react-share';

const ShareButtons = ({ 
  url, 
  title, 
  description, 
  hashtags = ['TrySnowball'],
  imageUrl = 'https://trysnowball.co.uk/og-default.png', // Default OG image
  onShare = null 
}) => {
  if (!url || !title) return null;

  const handleShare = (platform) => {
    // Analytics tracking
    try {
      if (window.posthog) {
        window.posthog.capture('share_clicked', {
          platform: platform,
          url: url,
          title: title
        });
      }
    } catch (error) {
      console.log('Analytics tracking failed:', error);
    }

    // Custom callback
    if (onShare) {
      onShare(platform);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center">
      <TwitterShareButton 
        url={url} 
        title={title} 
        hashtags={hashtags}
        onClick={() => handleShare('twitter')}
      >
        <TwitterIcon size={40} round />
      </TwitterShareButton>

      <FacebookShareButton 
        url={url} 
        quote={title}
        onClick={() => handleShare('facebook')}
      >
        <FacebookIcon size={40} round />
      </FacebookShareButton>

      <WhatsappShareButton 
        url={url} 
        title={title} 
        separator=" - "
        onClick={() => handleShare('whatsapp')}
      >
        <WhatsappIcon size={40} round />
      </WhatsappShareButton>

      <LinkedinShareButton 
        url={url} 
        title={title} 
        summary={description}
        source="TrySnowball"
        onClick={() => handleShare('linkedin')}
      >
        <LinkedinIcon size={40} round />
      </LinkedinShareButton>
    </div>
  );
};

export default ShareButtons;