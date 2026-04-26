
// ── Teaser flow ───────────────────────────────────────────────────────────────

async function handleFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  if (file.size > 8 * 1024 * 1024) {
    showTeaserError('File too large. Maximum 8 MB.');
    return;
  }

  const teaser = document.getElementById('teaser');
  const teaserCompany = document.getElementById('teaser-company');
  const teaserFound = document.getElementById('teaser-found');
  const teaserSub = document.getElementById('teaser-sub');
  const teaserLocked = document.getElementById('teaser-locked-text');
  const modalCopy = document.getElementById('modal-dynamic-copy');

  teaser.style.display = 'block';
  teaser.classList.remove('teaser--visible');
  teaserCompany.textContent = 'Checking your flight...';
  teaserFound.textContent = 'Just a moment...';
  teaserSub.textContent = 'Your document is being checked.';
  setTimeout(() => teaser.classList.add('teaser--visible'), 10);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${WORKER_URL}/analyze`, { method: 'POST', body: formData });
    const data = await res.json();

    if (!data.ok) throw new Error(data.error || 'Check failed');

    const airline = data.airline || null;
    const risk = data.risk || 'medium';
    const claimAmount = data.claim_amount || null;
    const disruptionType = data.disruption_type || null;

    if (claimAmount) {
      teaserCompany.textContent = `We've found potential compensation of \u00A3${claimAmount} for your flight`;
    } else {
      teaserCompany.textContent = airline ? `We've found potential compensation for your ${airline} flight` : "We've found potential compensation for your flight";
    }

    teaserFound.textContent = 'Initial check:';

    const riskMessages = {
      high: '\u2705 Good chance of compensation — your claim looks strong.',
      medium: '\uD83D\uDFE0 Possible compensation — a full check will confirm.',
      low: '\uD83D\uDFE1 Lower chance — but worth checking properly.'
    };
    teaserSub.textContent = riskMessages[risk] || 'Click below to get your full claim letter.';

    if (teaserLocked) {
      const amountText = claimAmount ? `\u00A3${claimAmount}` : 'your compensation';
      teaserLocked.innerHTML = `<strong>Full check + claim letter after payment</strong>
        We'll check your right to ${amountText} and write a ready-to-send claim letter — within 24 hours.`;
    }

    if (modalCopy) {
      if (claimAmount && airline) {
        modalCopy.textContent = `We found a possible \u00A3${claimAmount} claim against ${airline}. Full check follows after payment.`;
      } else if (airline) {
        modalCopy.textContent = `We found your ${airline} flight. Full check follows after payment.`;
      } else {
        modalCopy.textContent = 'We found initial signs of a valid claim. Full check follows after payment.';
      }
    }

  } catch (err) {
    teaserCompany.textContent = 'Flight found';
    teaserFound.textContent = 'Ready to check:';
    teaserSub.textContent = 'Click below to get your full compensation check and claim letter.';
    console.warn('Triage error:', err.message);
  }

  teaser.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showTeaserError(msg) {
  const teaser = document.getElementById('teaser');
  if (teaser) {
    teaser.style.display = 'block';
    const sub = document.getElementById('teaser-sub');
    if (sub) sub.textContent = msg;
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function openModal() {
  const modal = document.getElementById('modal');
  if (modal) { modal.classList.add('modal--open'); document.body.style.overflow = 'hidden'; }
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) { modal.classList.remove('modal--open'); document.body.style.overflow = ''; }
}

function closeModalOutside(event) {
  if (event.target === document.getElementById('modal')) closeModal();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── FAQ accordion ─────────────────────────────────────────────────────────────

function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const answer = item.querySelector('.faq-a');
  const chevron = item.querySelector('.faq-chevron');
  const isOpen = item.classList.contains('faq-item--open');

  document.querySelectorAll('.faq-item--open').forEach(openItem => {
    openItem.classList.remove('faq-item--open');
    const a = openItem.querySelector('.faq-a');
    const c = openItem.querySelector('.faq-chevron');
    if (a) a.style.maxHeight = null;
    if (c) c.style.transform = '';
  });

  if (!isOpen) {
    item.classList.add('faq-item--open');
    if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  }
}

// ── Sticky footer ─────────────────────────────────────────────────────────────

(function initStickyFooter() {
  const stickyFooter = document.getElementById('sticky-footer');
  if (!stickyFooter) return;
  let ticking = false;

  function updateSticky() {
    const scrollY = window.scrollY;
    const nearBottom = scrollY + window.innerHeight > document.documentElement.scrollHeight - 200;
    if (scrollY > 400 && !nearBottom) {
      stickyFooter.classList.add('sticky-footer--visible');
    } else {
      stickyFooter.classList.remove('sticky-footer--visible');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateSticky); ticking = true; }
  }, { passive: true });
})();
