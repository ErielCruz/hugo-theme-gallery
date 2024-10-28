import PhotoSwipeLightbox from "./photoswipe/photoswipe-lightbox.esm.js";
import PhotoSwipe from "./photoswipe/photoswipe.esm.js";
import PhotoSwipeDynamicCaption from "./photoswipe/photoswipe-dynamic-caption-plugin.esm.min.js";
import * as params from "@params";

// Fix: Remove trailing slash from worker URL
const WORKER_URL = 'https://photo-feedback.main-domains.workers.dev'; // Your actual worker URL

// Helper function to construct API URLs correctly
function getApiUrl(endpoint) {
  return `${WORKER_URL}/api/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
}

const sessionId = localStorage.getItem('feedbackSessionId') || 
  Math.random().toString(36).substring(2);
localStorage.setItem('feedbackSessionId', sessionId);

// Helper function to send feedback
async function sendFeedback(reaction, photoId, buttonElement, pswp) {
  if (!photoId) {
    console.error('No photo ID provided');
    return;
  }

  try {
    const response = await fetch(getApiUrl('feedback'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        reaction,
        sessionId
      })
    });

    if (response.ok) {
      // Visual feedback
      const allButtons = pswp.element.querySelectorAll('.pswp__button');
      allButtons.forEach(btn => btn.classList.remove('pswp__button--selected'));
      buttonElement.classList.add('pswp__button--selected');

      // Show toast notification
      const toast = document.createElement('div');
      toast.className = `pswp__feedback-toast pswp__feedback-toast--${reaction}`;
      toast.textContent = reaction.charAt(0).toUpperCase() + reaction.slice(1);
      pswp.element.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } else {
      console.error('Feedback submission failed:', await response.text());
    }
  } catch (error) {
    console.error('Error sending feedback:', error);
  }
}

// Helper function to get photo ID
function getPhotoId(element) {
  const photoId = element.getAttribute('data-photo-id');
  if (!photoId) {
    console.warn('No data-photo-id found on element:', element);
  }
  return photoId;
}

const gallery = document.getElementById("gallery");

if (gallery) {
  const galleryDownload = gallery.getAttribute("image-download") === "true";
  const galleryFeedback = gallery.getAttribute("image-feedback") === "true";

  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: ".gallery-item",
    showHideAnimationType: "zoom",
    bgOpacity: 1,
    pswpModule: PhotoSwipe,
    imageClickAction: "close",
    paddingFn: (viewportSize) => {
      return viewportSize.x < 700
        ? { top: 0, bottom: 0, left: 0, right: 0 }
        : { top: 30, bottom: 30, left: 0, right: 0 };
    },
    closeTitle: params.closeTitle,
    zoomTitle: params.zoomTitle,
    arrowPrevTitle: params.arrowPrevTitle,
    arrowNextTitle: params.arrowNextTitle,
    errorMsg: params.errorMsg,
  });


// Only register feedback buttons if galleryFeedback is true
if (galleryFeedback) {
  lightbox.on("uiRegister", () => {
    // Keep Button (checkmark)
    lightbox.pswp.ui.registerElement({
      name: "keep-button",
      order: 7,
      isButton: true,
      html: {
        isCustomSVG: true,
        inner: `<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32">
                  <use class="pswp__icn-shadow"></use>
                  <path d="M13 19.17l-3.17-3.17-1.41 1.41L13 22 23 12l-1.41-1.41z" id="pswp__icn-keep"></path>
                </svg>`,
        outlineID: "pswp__icn-keep"
      },
      onInit: (el, pswp) => {
        el.setAttribute("title", "Keep");
        el.className = "pswp__button pswp__button--keep";
        el.addEventListener('click', () => {
          const photoId = getPhotoId(pswp.currSlide.data.element);
          sendFeedback('keep', photoId, el, pswp);
        });
      }
    });

    // Like Button (star)
    lightbox.pswp.ui.registerElement({
      name: "like-button",
      order: 7,
      isButton: true,
      html: {
        isCustomSVG: true,
        // Like Button (star) - adjusted path for proper vertical alignment
        inner: `<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32">
                  <use class="pswp__icn-shadow"></use>
                  <path d="M16 8.2l2.17 5.35 5.63 0.47-4.28 3.7 0.13 5.63L16 20.85l-4.85 2.5 0.13-5.63-4.28-3.7 5.63-0.47z" id="pswp__icn-like"></path>
                </svg>`,
        outlineID: "pswp__icn-like"
      },
      onInit: (el, pswp) => {
        el.setAttribute("title", "Like");
        el.className = "pswp__button pswp__button--like";
        el.addEventListener('click', () => {
          const photoId = getPhotoId(pswp.currSlide.data.element);
          sendFeedback('like', photoId, el, pswp);
        });
      }
    });

    // Love Button (heart)
    lightbox.pswp.ui.registerElement({
      name: "love-button",
      order: 7,
      isButton: true,
      html: {
        isCustomSVG: true,
        inner: `<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32">
                  <use class="pswp__icn-shadow"></use>
                  <path d="M16 23.35l-1.45-1.32C10.4 18.36 8 15.28 8 12.5 8 10.42 9.42 9 11.5 9c1.74 0 3.41.81 4.5 2.09C17.09 9.81 18.76 9 20.5 9 22.58 9 24 10.42 24 12.5c0 2.78-2.4 5.86-6.55 9.54L16 23.35z" id="pswp__icn-love"></path>
                </svg>`,
        outlineID: "pswp__icn-love"
      },
      onInit: (el, pswp) => {
        el.setAttribute("title", "Love");
        el.className = "pswp__button pswp__button--love";
        el.addEventListener('click', () => {
          const photoId = getPhotoId(pswp.currSlide.data.element);
          sendFeedback('love', photoId, el, pswp);
        });
      }
    });
  });
}

  // Register the download button only if galleryDownload is true
  if (galleryDownload) {
    lightbox.on("uiRegister", () => {
      lightbox.pswp.ui.registerElement({
        name: "download-button",
        order: 8,
        isButton: true,
        tagName: "a",
        html: {
          isCustomSVG: true,
          inner: '<path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" id="pswp__icn-download"/>',
          outlineID: "pswp__icn-download",
        },
        onInit: (el, pswp) => {
          el.setAttribute("download", "");
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
          el.setAttribute("title", params.downloadTitle || "Download");
          pswp.on("change", () => {
            el.href = pswp.currSlide.data.element.href;
          });
        },
      });
    });
  }

  // Handle back button and history
  window.onhashchange = function(event) {
    if (event.newURL.indexOf(window.location.pathname) !== -1) {
      location.reload();
    }
  };

  lightbox.on("change", () => {
    history.replaceState("", document.title, "#" + (lightbox.pswp.currSlide.index + 1));
  });

  lightbox.on("close", () => {
    window.history.back();
    history.replaceState("", document.title, window.location.pathname);
  });

  new PhotoSwipeDynamicCaption(lightbox, {
    mobileLayoutBreakpoint: 700,
    type: "auto",
    mobileCaptionOverlapRatio: 1,
  });

  lightbox.init();

  if (window.location.hash.substring(1).length > 0) {
    const index = parseInt(window.location.hash.substring(1), 10) - 1;
    if (!Number.isNaN(index) && index >= 0 && index < gallery.querySelectorAll("a").length) {
      lightbox.loadAndOpen(index, { gallery });
    }
  }
}