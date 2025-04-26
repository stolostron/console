# 📝 Summary

**Ticket Summary (Title):**  
<!-- Use the exact title from Jira or a brief, clear summary -->

**Ticket Link:**  
<!-- e.g. https://issues.redhat.com/browse/ACM-12345 -->

**Type of Change:**  
<!-- Select one -->
- [ ] 🐞 Bug Fix  
- [ ] ✨ Feature  
- [ ] 🔧 Refactor
- [ ] 💸 Tech Debt
- [ ] 🧪 Test-related  
- [ ] 📄 Docs

---

## ✅ Checklist

### General

- [ ] PR title follows the convention (e.g. `ACM-12340 Fix bug with...`)
- [ ] Code builds and runs locally without errors
- [ ] No console logs, commented-out code, or unnecessary files
- [ ] All commits are meaningful and well-labeled
- [ ] All new display strings are externalized for localization (English only)
- [ ] *(Nice to have)* JSDoc comments added for new functions and interfaces

#### If Feature

- [ ] UI/UX reviewed (if applicable)
- [ ] All acceptance criteria met
- [ ] Unit test coverage added or updated
- [ ] Relevant documentation or comments included

#### If Bugfix

- [ ] Root cause and fix summary are documented in the ticket (for future reference / errata)
- [ ] Fix tested thoroughly and resolves the issue
- [ ] Test(s) added to prevent regression

---

### 🗒️ Notes for Reviewers
<!-- Optional: anything reviewers should know, special context, etc. -->