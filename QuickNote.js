class NotesApp {
            constructor() {
                this.notes = [];
                this.currentEditId = null;
                this.selectedColor = 'blue';
                this.loadNotes();
                this.bindEvents();
                this.renderNotes();
            }

            bindEvents() {
                // Form submission
                document.getElementById('noteForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveNote();
                });

                // Search functionality
                document.getElementById('searchInput').addEventListener('input', () => {
                    this.renderNotes();
                });

                // Sort functionality
                document.getElementById('sortSelect').addEventListener('change', () => {
                    this.renderNotes();
                });

                // Color filter
                document.getElementById('colorFilter').addEventListener('change', () => {
                    this.renderNotes();
                });

                // Color picker
                document.querySelectorAll('.color-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                        e.target.classList.add('selected');
                        this.selectedColor = e.target.dataset.color;
                    });
                });

                // Modal close on background click
                document.getElementById('noteModal').addEventListener('click', (e) => {
                    if (e.target.id === 'noteModal') this.closeModal();
                });

                document.getElementById('viewModal').addEventListener('click', (e) => {
                    if (e.target.id === 'viewModal') this.closeViewModal();
                });

                // Edit from view modal
                document.getElementById('editFromViewBtn').addEventListener('click', () => {
                    this.closeViewModal();
                    this.editNote(this.currentViewId);
                });
            }

            generateId() {
                return Date.now().toString(36) + Math.random().toString(36).substr(2);
            }

            saveNote() {
                const title = document.getElementById('noteTitle').value.trim();
                const content = document.getElementById('noteContent').value.trim();

                if (!title || !content) return;

                const note = {
                    id: this.currentEditId || this.generateId(),
                    title,
                    content,
                    color: this.selectedColor,
                    createdAt: this.currentEditId ? 
                        this.notes.find(n => n.id === this.currentEditId).createdAt : 
                        new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (this.currentEditId) {
                    const index = this.notes.findIndex(n => n.id === this.currentEditId);
                    this.notes[index] = note;
                } else {
                    this.notes.unshift(note);
                }

                this.saveToStorage();
                this.renderNotes();
                this.closeModal();
            }

            editNote(id) {
                const note = this.notes.find(n => n.id === id);
                if (!note) return;

                this.currentEditId = id;
                document.getElementById('modalTitle').textContent = 'Edit Note';
                document.getElementById('saveBtn').innerHTML = '💾 Update Note';
                document.getElementById('noteTitle').value = note.title;
                document.getElementById('noteContent').value = note.content;

                // Set color
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                document.querySelector(`[data-color="${note.color}"]`).classList.add('selected');
                this.selectedColor = note.color;

                this.openModal();
            }

            deleteNote(id) {
                if (confirm('Are you sure you want to delete this note?')) {
                    this.notes = this.notes.filter(n => n.id !== id);
                    this.saveToStorage();
                    this.renderNotes();
                }
            }

            viewNote(id) {
                const note = this.notes.find(n => n.id === id);
                if (!note) return;

                this.currentViewId = id;
                document.getElementById('viewTitle').textContent = note.title;
                document.getElementById('viewContent').innerHTML = `
                    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                        <small style="color: #999;">
                            Created: ${new Date(note.createdAt).toLocaleDateString()} 
                            ${note.updatedAt !== note.createdAt ? `• Updated: ${new Date(note.updatedAt).toLocaleDateString()}` : ''}
                        </small>
                    </div>
                    <div style="line-height: 1.6; white-space: pre-wrap;">${note.content}</div>
                `;
                this.openViewModal();
            }

            getFilteredAndSortedNotes() {
                let filtered = [...this.notes];

                // Search filter
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                if (searchTerm) {
                    filtered = filtered.filter(note => 
                        note.title.toLowerCase().includes(searchTerm) ||
                        note.content.toLowerCase().includes(searchTerm)
                    );
                }

                // Color filter
                const colorFilter = document.getElementById('colorFilter').value;
                if (colorFilter !== 'all') {
                    filtered = filtered.filter(note => note.color === colorFilter);
                }

                // Sort
                const sortBy = document.getElementById('sortSelect').value;
                filtered.sort((a, b) => {
                    switch (sortBy) {
                        case 'oldest':
                            return new Date(a.createdAt) - new Date(b.createdAt);
                        case 'title':
                            return a.title.localeCompare(b.title);
                        case 'title-desc':
                            return b.title.localeCompare(a.title);
                        default: // newest
                            return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                });

                return filtered;
            }

            renderNotes() {
                const filteredNotes = this.getFilteredAndSortedNotes();
                const container = document.getElementById('notesGrid');
                const emptyState = document.getElementById('emptyState');

                // Update stats
                document.getElementById('totalNotes').textContent = this.notes.length;
                document.getElementById('filteredNotes').textContent = filteredNotes.length;

                if (filteredNotes.length === 0) {
                    container.innerHTML = '';
                    emptyState.style.display = 'block';
                    if (this.notes.length === 0) {
                        emptyState.querySelector('h3').textContent = 'No notes yet!';
                        emptyState.querySelector('p').textContent = 'Create your first note to get started';
                    } else {
                        emptyState.querySelector('h3').textContent = 'No matching notes';
                        emptyState.querySelector('p').textContent = 'Try adjusting your search or filters';
                    }
                    return;
                }

                emptyState.style.display = 'none';
                container.innerHTML = filteredNotes.map(note => `
                    <div class="note-card color-${note.color}" onclick="app.viewNote('${note.id}')">
                        <div class="note-header">
                            <div>
                                <div class="note-title">${this.escapeHtml(note.title)}</div>
                                <div class="note-date">${new Date(note.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div class="note-actions">
                                <button class="action-btn edit" onclick="event.stopPropagation(); app.editNote('${note.id}')" title="Edit">
                                    ✏️
                                </button>
                                <button class="action-btn delete" onclick="event.stopPropagation(); app.deleteNote('${note.id}')" title="Delete">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div class="note-content">${this.escapeHtml(note.content)}</div>
                        <div class="note-footer">
                            <span>${note.content.length} characters</span>
                            ${note.updatedAt !== note.createdAt ? '<span>Modified</span>' : ''}
                        </div>
                    </div>
                `).join('');
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            openModal() {
                document.getElementById('noteModal').classList.add('show');
                document.getElementById('noteTitle').focus();
            }

            closeModal() {
                document.getElementById('noteModal').classList.remove('show');
                document.getElementById('noteForm').reset();
                this.currentEditId = null;
                document.getElementById('modalTitle').textContent = 'Add New Note';
                document.getElementById('saveBtn').innerHTML = '💾 Save Note';
                
                // Reset color selection
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                document.querySelector('[data-color="blue"]').classList.add('selected');
                this.selectedColor = 'blue';
            }

            openViewModal() {
                document.getElementById('viewModal').classList.add('show');
            }

            closeViewModal() {
                document.getElementById('viewModal').classList.remove('show');
                this.currentViewId = null;
            }

            saveToStorage() {
                // In a real application, this would save to localStorage
                // For this demo, we'll just store in memory
                console.log('Notes saved:', this.notes);
            }

            loadNotes() {
                // In a real application, this would load from localStorage
                // For demo purposes, we'll start with some sample data
                this.notes = [
                    {
                        id: 'sample1',
                        title: 'Welcome to QuickNotes!',
                        content: 'This is your first note. You can edit, delete, or create new notes using the controls above.\n\nFeatures:\n• Search and filter notes\n• Color-coded organization\n• Rich text support\n• Responsive design',
                        color: 'blue',
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        updatedAt: new Date(Date.now() - 86400000).toISOString()
                    },
                    {
                        id: 'sample2',
                        title: 'Meeting Notes',
                        content: 'Project kickoff meeting:\n• Discussed timeline and milestones\n• Assigned team roles\n• Next meeting scheduled for Friday',
                        color: 'green',
                        createdAt: new Date(Date.now() - 172800000).toISOString(),
                        updatedAt: new Date(Date.now() - 172800000).toISOString()
                    },
                    {
                        id: 'sample3',
                        title: 'Shopping List',
                        content: 'Groceries needed:\n• Milk\n• Bread\n• Eggs\n• Bananas\n• Coffee\n• Vegetables for dinner',
                        color: 'yellow',
                        createdAt: new Date(Date.now() - 259200000).toISOString(),
                        updatedAt: new Date(Date.now() - 259200000).toISOString()
                    }
                ];
            }
        }

        // Global functions for onclick handlers
        function openAddModal() {
            app.openModal();
        }

        function closeModal() {
            app.closeModal();
        }

        function closeViewModal() {
            app.closeViewModal();
        }

        // Initialize the app
        const app = new NotesApp();