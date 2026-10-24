const fs = require('fs');
const path = require('path');

function createDbClient(dbFilePath) {
  let writeMutex = Promise.resolve();

  function readDB() {
    if (!fs.existsSync(dbFilePath)) {
      const initial = {
        users: [],
        resumes: [],
        atsAnalyses: [],
        interviewSessions: [],
        aptitudeQuestions: [],
        aptitudeAttempts: []
      };
      writeDB(initial);
      return initial;
    }
    try {
      const raw = fs.readFileSync(dbFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return {
        users: [],
        resumes: [],
        atsAnalyses: [],
        interviewSessions: [],
        aptitudeQuestions: [],
        aptitudeAttempts: []
      };
    }
  }

  function writeDB(data) {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const content = JSON.stringify(data, null, 2);
    const tmpFile = `${dbFilePath}.${Date.now()}_${Math.random().toString(36).substring(2, 7)}.tmp`;
    fs.writeFileSync(tmpFile, content, 'utf-8');

    let retries = 8;
    while (retries > 0) {
      try {
        fs.renameSync(tmpFile, dbFilePath);
        return;
      } catch (err) {
        if (err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EEXIST') {
          retries--;
          if (retries === 0) {
            try {
              fs.copyFileSync(tmpFile, dbFilePath);
              try { fs.unlinkSync(tmpFile); } catch {}
              return;
            } catch (copyErr) {
              fs.writeFileSync(dbFilePath, content, 'utf-8');
              try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
              return;
            }
          }
          // Sleep 15ms on Windows for file handle release
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15);
        } else {
          throw err;
        }
      }
    }
  }

  async function updateDB(mutator) {
    const currentLock = writeMutex;
    let release = () => {};
    writeMutex = new Promise((resolve) => {
      release = resolve;
    });

    try {
      await currentLock;
      const db = readDB();
      const result = await mutator(db);
      writeDB(db);
      return result;
    } finally {
      release();
    }
  }

  async function saveResume(resume) {
    return updateDB((db) => {
      const idx = db.resumes.findIndex((r) => r.id === resume.id);
      if (idx >= 0) {
        db.resumes[idx] = resume;
      } else {
        db.resumes.push(resume);
      }
      return resume;
    });
  }

  async function saveAptitudeAttempt(attempt) {
    return updateDB((db) => {
      db.aptitudeAttempts.push(attempt);
      return attempt;
    });
  }

  async function createInterviewSession(session) {
    return updateDB((db) => {
      db.interviewSessions.push(session);
      return session;
    });
  }

  async function saveATSAnalysis(analysis) {
    return updateDB((db) => {
      db.atsAnalyses.push(analysis);
      return analysis;
    });
  }

  return {
    readDB,
    writeDB,
    updateDB,
    saveResume,
    saveAptitudeAttempt,
    createInterviewSession,
    saveATSAnalysis
  };
}

module.exports = { createDbClient };
