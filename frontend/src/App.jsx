import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';


function App() {

  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    topics: '',
    deadline: ''
  });
  const [selectedDate, setSelectedDate] = useState('');

  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState([]);


  useEffect(() => {
    fetchSubjects();
    checkAuthStatus();

    // Check for auth success query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      setIsCalendarConnected(true);
      // Clean URL
      // Clean URL
      window.history.replaceState({}, document.title, "/");
      // Show preview on initial connect

    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/google/status`);
      const data = await response.json();
      console.log("Auth status check:", data);
      setIsCalendarConnected(data.authenticated);
      if (data.email) {
        setUserEmail(data.email);
        fetchCalendarEvents();
      }
    } catch (error) {
      console.error("Failed to check auth status", error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/calendar/events`);
      if (response.ok) {
        const data = await response.json();
        setCalendarEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch calendar events", error);
    }
  };

  const connectCalendar = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/google/url`);
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      alert("Failed to initiate connection");
    }
  };

  const syncCalendar = async () => {
    try {
      const response = await fetch(`${API_URL}/sync-calendar`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchCalendarEvents();
        setCalendarRefreshKey(prev => prev + 1);
      } else {
        alert("Failed to sync. Please try reconnecting.");
        setIsCalendarConnected(false);
      }
    } catch (error) {
      alert("Error syncing calendar");
    }
  };

  const disconnectCalendar = async () => {
    if (!confirm("Are you sure you want to disconnect your Google Calendar?")) return;
    try {
      await fetch(`${API_URL}/auth/google/logout`, { method: 'POST' });
      setIsCalendarConnected(false);
      setUserEmail('');
      setCalendarEvents([]);
      alert("Disconnected successfully");
    } catch (error) {
      alert("Failed to disconnect");
    }
  };

  const fetchSubjects = async () => {
    const response = await fetch(`${API_URL}/subjects`);
    const data = await response.json();
    setSubjects(data);
  };

  const fetchTasks = async (date = null) => {
    const url = date ? `${API_URL}/tasks?date_filter=${date}` : `${API_URL}/tasks`;
    const response = await fetch(url);
    const data = await response.json();
    setTasks(data);
  };

  const addSubject = async (e) => {
    e.preventDefault();

    const topicsArray = newSubject.topics.split(',').map(t => t.trim()).filter(t => t);

    await fetch(`${API_URL}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newSubject.name,
        topics: topicsArray,
        deadline: newSubject.deadline
      })
    });

    setNewSubject({ name: '', topics: '', deadline: '' });
    setShowAddSubject(false);
    fetchSubjects();
  };

  const generatePlan = async () => {
    await fetch(`${API_URL}/generate-plan`, { method: 'POST' });
    fetchTasks();
    fetchCalendarEvents();
    setCalendarRefreshKey(prev => prev + 1);
  };

  const updateTask = async (taskId, updates) => {
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    fetchTasks(selectedDate);
    setCalendarRefreshKey(prev => prev + 1);
  };

  const deleteSubject = async (subjectId) => {
    await fetch(`${API_URL}/subjects/${subjectId}`, { method: 'DELETE' });
    fetchSubjects();
    setCalendarRefreshKey(prev => prev + 1);
  };

  const groupTasksByDate = () => {
    const grouped = {};
    tasks.forEach(task => {
      if (!grouped[task.scheduled_date]) {
        grouped[task.scheduled_date] = [];
      }
      grouped[task.scheduled_date].push(task);
    });
    return grouped;
  };

  const groupedTasks = groupTasksByDate();

  return (
    <div className="app-container">
      <header className="section">
        <h1>Study Planner Pro</h1>
        {!isCalendarConnected && (
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Connect your Google Calendar to sync your study schedule automatically.
            </p>
            <button className="btn btn-primary" onClick={connectCalendar}>
              <span>📅</span> Connect Google Calendar
            </button>
          </div>
        )}
      </header>

      {isCalendarConnected && (
        <section className="section">
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2>Your Calendar</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={syncCalendar}>Sync Now</button>
                <button className="btn btn-danger" style={{ padding: '8px 12px' }} onClick={disconnectCalendar}>Disconnect</button>
              </div>
            </div>
            {userEmail && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Connected as: <span style={{ color: 'var(--primary-color)', fontWeight: '500' }}>{userEmail}</span>
              </p>
            )}
            <div className="calendar-container" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
              <iframe
                key={calendarRefreshKey}
                src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(userEmail || 'primary')}&mode=WEEK&ctz=Asia/Kolkata&hl=en&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=1`}
                style={{ border: 0, width: '100%', flexGrow: 1 }}
                frameBorder="0"
                scrolling="no"
              ></iframe>
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <a 
                  href="https://calendar.google.com/calendar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  🔗 View on Google Calendar
                </a>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  If the widget above is blank or shows an error, please ensure you are logged into your <strong>{userEmail}</strong> account in this browser.
                </p>
              </div>
            </div>

            {calendarEvents.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Upcoming Study Sessions (Verified)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {calendarEvents.map((event, idx) => (
                    <div key={event.id || idx} className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>{event.summary}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                          {event.start?.date || (event.start?.dateTime && new Date(event.start.dateTime).toLocaleDateString())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Subjects</h2>
          {!showAddSubject && (
            <button className="btn btn-primary" onClick={() => setShowAddSubject(true)}>
              + Add Subject
            </button>
          )}
        </div>

        {showAddSubject && (
          <div className="glass-card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.4s ease-out' }}>
            <form onSubmit={addSubject}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Subject name (e.g., Mathematics)"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Topics (comma separated, e.g., Calculus, Algebra)"
                  value={newSubject.topics}
                  onChange={(e) => setNewSubject({ ...newSubject, topics: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="date"
                  value={newSubject.deadline}
                  onChange={(e) => setNewSubject({ ...newSubject, deadline: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">Save Subject</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSubject(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="subject-grid">
          {subjects.map(subject => (
            <div key={subject.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3>{subject.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Deadline: {new Date(subject.deadline).toLocaleDateString()}
                  </p>
                </div>
                <button className="btn btn-danger" onClick={() => deleteSubject(subject.id)} style={{ padding: '8px' }}>
                  🗑️
                </button>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {subject.topics.map((topic, i) => (
                    <span key={i} className="badge badge-success" style={{ fontSize: '0.75rem' }}>{topic}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={generatePlan} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
          ✨ Generate Smart Study Plan
        </button>
      </section>

      <section className="section">
        <h2>Daily Schedule</h2>
        
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <label style={{ color: 'var(--text-secondary)' }}>Filter by date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                fetchTasks(e.target.value);
              }}
              style={{ width: 'auto' }}
            />
            <button className="btn btn-secondary" onClick={() => { setSelectedDate(''); fetchTasks(); }}>
              Show All
            </button>
          </div>
        </div>

        {Object.keys(groupedTasks).length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No tasks scheduled yet. Add subjects and generate your plan!</p>
          </div>
        )}

        {Object.keys(groupedTasks).sort().map(date => (
          <div key={date} style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {groupedTasks[date].map(task => (
                <div
                  key={task.id}
                  className={`task-item ${task.completed ? 'completed' : ''} ${task.missed ? 'missed' : ''}`}
                >
                  <div>
                    <div style={{ fontWeight: '600' }}>{task.subject_name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{task.topic}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!task.completed && !task.missed && (
                      <>
                        <button className="btn btn-primary" onClick={() => updateTask(task.id, { completed: true })} style={{ padding: '6px 12px' }}>
                          Done
                        </button>
                        <button className="btn btn-secondary" onClick={() => updateTask(task.id, { missed: true })} style={{ padding: '6px 12px' }}>
                          Missed
                        </button>
                      </>
                    )}
                    {task.completed && <span className="badge badge-success">✓ Completed</span>}
                    {task.missed && <span className="badge badge-danger">✗ Missed</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default App;