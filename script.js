const body = document.body;
const menuBtn = document.getElementById('menuBtn');
const overlay = document.getElementById('overlay');
const askAiBtn = document.getElementById('askAiBtn');
const closeChatBtn = document.getElementById('closeChatBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatMessages = document.getElementById('chatMessages');
const welcomeText = document.getElementById('welcomeText');
const suggestions = document.querySelectorAll('.suggestion');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const searchInputs = document.querySelectorAll('.search-input');
const sortBtn = document.getElementById('sortBtn');
const tableBody = document.getElementById('tableBody');

let isLoading = false;

// the first question fails on purpose so the error state can be seen
let firstTry = true;

// scripted replies (no backend)
const answers = {
  attention: {
    title: 'Urgent attention request',
    text: 'Request #MR-2837 needs attention, the request has been in progress for 35 minutes and is still unresolved.',
    requestId: 'MR-2837'
  },
  summary: {
    title: "Today's summary",
    text: '4 requests came in today. 1 is awaiting a technician, 2 are in progress and 1 has been completed.'
  },
  changes: {
    title: 'What changed today',
    text: '#MR-2841 (AC not working) was reported 5 mins ago and is waiting for Mary David. #MR-2834 (Ceiling tile damage) has been completed.',
    requestId: 'MR-2841'
  },
  openRequests: {
    title: 'Open Requests: 24',
    text: 'These are all the requests that have not been completed yet. 5 are awaiting a technician and 8 are in progress.'
  },
  awaiting: {
    title: 'Awaiting Technician: 5',
    text: 'These requests have not been picked up by a technician yet. The newest one is #MR-2841.',
    requestId: 'MR-2841'
  },
  inProgress: {
    title: 'In Progress: 8',
    text: 'A technician is working on these requests. #MR-2837 has been in progress the longest today.',
    requestId: 'MR-2837'
  },
  completed: {
    title: 'Completed Today: 18',
    text: '18 requests have been completed today, including #MR-2834 (Ceiling tile damage).',
    requestId: 'MR-2834'
  },
  notSure: {
    title: "Sorry, I didn't get that",
    text: "Try asking which request needs attention, for a summary of today's requests or what changed today."
  }
};


// ----- Mobile menu -----

menuBtn.addEventListener('click', function () {
  body.classList.toggle('menu-open');
});

overlay.addEventListener('click', function () {
  body.classList.remove('menu-open');
});


// ----- Open and close the chat -----

askAiBtn.addEventListener('click', function () {
  body.classList.toggle('chat-open');
});

closeChatBtn.addEventListener('click', function () {
  body.classList.remove('chat-open');
});

newChatBtn.addEventListener('click', function () {
  if (isLoading) return;
  chatMessages.innerHTML = '';
  chatMessages.appendChild(welcomeText);
  clearSuggestions();
});


// ----- Search and sort the table -----

searchInputs.forEach(function (input) {
  input.addEventListener('input', function () {
    const value = input.value.toLowerCase();
    const rows = tableBody.querySelectorAll('tr');

    rows.forEach(function (row) {
      if (row.textContent.toLowerCase().includes(value)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });
});

// switches between newest first and oldest first
sortBtn.addEventListener('click', function () {
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  rows.reverse();
  rows.forEach(function (row) {
    tableBody.appendChild(row);
  });
});


// ----- Sending messages -----

suggestions.forEach(function (button) {
  button.addEventListener('click', function () {
    if (isLoading) return;
    clearSuggestions();
    button.classList.add('active');
    sendMessage(button.textContent.trim());
  });
});

chatForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (text === '' || isLoading) return;

  chatInput.value = '';
  clearSuggestions();
  sendMessage(text);
});

function clearSuggestions() {
  suggestions.forEach(function (button) {
    button.classList.remove('active');
  });
}

function sendMessage(text) {
  welcomeText.remove();

  const userMessage = document.createElement('div');
  userMessage.className = 'user-message';
  userMessage.textContent = text;
  chatMessages.appendChild(userMessage);

  getReply(text);
}

function getReply(text) {
  isLoading = true;

  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.innerHTML = '<span class="loading-dot"></span> Processing response';
  chatMessages.appendChild(loading);
  scrollToBottom();

  setTimeout(function () {
    loading.remove();
    isLoading = false;

    if (firstTry || !navigator.onLine) {
      firstTry = false;
      showError(text);
    } else {
      showAnswer(text);
    }
    scrollToBottom();
  }, 1500);
}

function showError(text) {
  const error = document.createElement('div');
  error.className = 'error-message';
  error.innerHTML = `
    <h3>Unable to connect</h3>
    <p>We couldn't connect to the AI assistant<br>Check your internet connection and<br>try again.</p>
    <button class="retry-btn">Retry</button>
  `;
  chatMessages.appendChild(error);

  error.querySelector('.retry-btn').addEventListener('click', function () {
    error.remove();
    getReply(text);
  });
}

function showAnswer(text) {
  const answer = findAnswer(text);

  const message = document.createElement('div');
  message.className = 'ai-message';
  message.innerHTML = `<h3>${answer.title}</h3><p>${answer.text}</p>`;

  if (answer.requestId) {
    const viewBtn = document.createElement('button');
    viewBtn.className = 'view-btn';
    viewBtn.innerHTML = 'View request <iconify-icon icon="basil:caret-down-outline" width="36" height="36"></iconify-icon>';
    viewBtn.addEventListener('click', function () {
      showRequest(answer.requestId);
    });
    message.appendChild(viewBtn);
  }

  chatMessages.appendChild(message);
}

function findAnswer(text) {
  const question = text.toLowerCase();

  if (question.includes('attention') || question.includes('urgent')) return answers.attention;
  if (question.includes('summar')) return answers.summary;
  if (question.includes('change')) return answers.changes;
  if (question.includes('open')) return answers.openRequests;
  if (question.includes('awaiting') || question.includes('technician')) return answers.awaiting;
  if (question.includes('progress')) return answers.inProgress;
  if (question.includes('complete')) return answers.completed;

  return answers.notSure;
}

// scrolls to the request in the table and highlights it
function showRequest(id) {
  const row = document.getElementById(id);

  // clear any search so the row is visible
  searchInputs.forEach(function (input) {
    input.value = '';
  });
  tableBody.querySelectorAll('tr').forEach(function (r) {
    r.style.display = '';
  });

  // on mobile the chat covers the screen, so close it first
  if (window.innerWidth < 768) {
    body.classList.remove('chat-open');
  }

  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  row.classList.add('highlight');

  setTimeout(function () {
    row.classList.remove('highlight');
  }, 2000);
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
