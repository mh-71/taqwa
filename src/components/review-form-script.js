// Character counter polling
function startCharCounterPolling() {
  console.log('[CharCounter] Script loaded');
  let lastValue = '';
  let initialized = false;

  const poll = () => {
    const reviewText = document.getElementById('reviewText');
    const charCount = document.getElementById('charCount');

    if (reviewText && charCount) {
      if (!initialized) {
        initialized = true;
        console.log('[CharCounter] Elements found, polling started');
      }

      if (reviewText.value !== lastValue) {
        const len = reviewText.value.length;
        charCount.textContent = len.toString();
        lastValue = reviewText.value;
      }
    }
  };

  setInterval(poll, 50);
}

// Star rating interaction
function initStarRating() {
  const ratingInputs = document.querySelectorAll('input[name="rating"]');
  const ratingLabels = document.querySelectorAll('.rating-label');

  ratingInputs.forEach((input, index) => {
    input.addEventListener('change', () => {
      ratingLabels.forEach((label, i) => {
        label.classList.toggle('selected', i <= index);
      });
    });
  });
}

// Form submission
function initFormSubmission() {
  const base = import.meta.env.BASE_URL || '/';
  const form = document.getElementById('reviewForm');
  const formMessage = document.getElementById('formMessage');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);

      try {
        const response = await fetch(`${base}api/reviews`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          formMessage.textContent = data.message || 'Review submitted successfully!';
          formMessage.className = 'success-message';
          formMessage.style.display = 'block';
          form.reset();
        } else {
          formMessage.textContent = data.error || 'Failed to submit review';
          formMessage.className = 'error-message';
          formMessage.style.display = 'block';
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        formMessage.textContent = 'Error submitting review. Please try again.';
        formMessage.className = 'error-message';
        formMessage.style.display = 'block';
      }
    });
  }
}

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    startCharCounterPolling();
    initStarRating();
    initFormSubmission();
  });
} else {
  startCharCounterPolling();
  initStarRating();
  initFormSubmission();
}
