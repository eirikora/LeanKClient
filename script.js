// This Javascript contains most functionality of the LeanK client app.
// It talks to the Archive server for storing and retrieving documents. 
// It autosaves after some seconds.
// This is a concept client, and we need a good client developer to rework it and make it work properly.
// Try to open this client (just open index.html) and open default server (hit enter) and archive 'test' and pwd 'test'.
// Your contributions are welcome! Best regards, Eirik Y. Øra, Oslo, Norwway. eirik.ora@gmail.com
document.addEventListener('DOMContentLoaded', () => {
    let editorInstance;
    let isContentChanged = false;
    let archiveServer = 'https://klinkserver.azurewebsites.net'; // For local test: 'http://127.0.0.1:5000'
    let archivePassword = null; // Variable to store the archive password

    // Toggle dark mode
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.querySelector('header').classList.toggle('dark-mode');
        document.querySelector('nav').classList.toggle('dark-mode');
        document.getElementById('container').classList.toggle('dark-mode');
        document.getElementById('leftContainer').classList.toggle('dark-mode');
        document.getElementById('searchContainer').classList.toggle('dark-mode');
        document.getElementById('searchField').classList.toggle('dark-mode');
        document.getElementById('editorContainer').classList.toggle('dark-mode');
        document.getElementById('nameField').classList.toggle('dark-mode');
        document.getElementById('saveBtn').classList.toggle('dark-mode');
        document.getElementById('incomingLinks').classList.toggle('dark-mode');
        document.getElementById('outgoingLinks').classList.toggle('dark-mode');
        document.getElementById('timeUpdated').classList.toggle('dark-mode');

        const treeItems = document.querySelectorAll('.tree-item');
        treeItems.forEach(item => {
            item.classList.toggle('dark-mode');
        });

        const incomingItems = document.querySelectorAll('.incoming-item');
        incomingItems.forEach(item => {
            item.classList.toggle('dark-mode');
        });

        const outgoingItems = document.querySelectorAll('.outgoing-item');
        outgoingItems.forEach(item => {
            item.classList.toggle('dark-mode');
        });

        // Update editor background color
        if (document.body.classList.contains('dark-mode')) {
            editorInstance.editing.view.change(writer => {
                writer.setStyle(
                    'background-color',
                    '#2a2a2a',
                    editorInstance.editing.view.document.getRoot()
                );
            });
        } else {
            editorInstance.editing.view.change(writer => {
                writer.setStyle(
                    'background-color',
                    '#ffffe0',
                    editorInstance.editing.view.document.getRoot()
                );
            });
        }
    });

    ClassicEditor
        .create(document.querySelector('#editor'), {
            toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote'],
            heading: {
                options: [
                    { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                    { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                    { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                    { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
                ]
            },
        })
        .then(editor => {
            editorInstance = editor;
            window.editor = editor;

            // Set initial editor background color based on the current mode
            if (document.body.classList.contains('dark-mode')) {
                editor.editing.view.change(writer => {
                    writer.setStyle(
                        'background-color',
                        '#2a2a2a',
                        editorInstance.editing.view.document.getRoot()
                    );
                });
            } else {
                editor.editing.view.change(writer => {
                    writer.setStyle(
                        'background-color',
                        '#ffffe0',
                        editorInstance.editing.view.document.getRoot()
                    );
                });
            }

            editor.model.document.on('change:data', () => {
                isContentChanged = true;
            });

            editor.editing.view.document.on('blur', () => {
                const editorData = editorInstance.getData();
                saveDocument();
                setOutgoingLinks(editorData);
            });

            loadTreeData();
        })
        .catch(error => {
            console.error(error);
        });

    document.getElementById('saveBtn').addEventListener('click', () => {
        saveDocument();
    });

    setInterval(() => {
        if (isContentChanged) {
            saveDocument();
            isContentChanged = false;
        }
    }, 30000);

    function setOutgoingLinks(editorData) {
        const extractedLinks = extractOutgoingLinks(editorData);
        document.getElementById('outgoingLinks').innerText = " ";
        const outgoingLinkSection = buildOutgoingList(extractedLinks);
        document.getElementById('outgoingLinks').appendChild(outgoingLinkSection);
    }

    function saveDocument() {
        const editorData = editorInstance.getData();
        const documentName = document.getElementById('nameField').value;
        const archiveName = document.getElementById('archiveName').textContent;

        if (!documentName || !archiveName || !archivePassword) {
            alert('Please enter document name and archive name, and ensure the archive is opened with a password.');
            return;
        }

        fetch(archiveServer + '/insert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Archive': archiveName,
                'Password': archivePassword
            },
            body: JSON.stringify({ name: documentName, body: editorData })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Unknown error');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            if (data.timeupdated) {
                document.getElementById('timeUpdated').innerText = `Last saved: ${data.timeupdated}`;
            }
            if (data.incominglinks) {
                document.getElementById('incomingLinks').innerText = "";
                const incomingLinkSection = buildIncomingList(data.incominglinks);
                document.getElementById('incomingLinks').appendChild(incomingLinkSection);
            }
            isContentChanged = false;
            loadTreeData();
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error saving document: ' + error.message);
        });
    }

    function openDocument() {
        const documentName = prompt('Please enter the document name to open:');
        const archiveName = document.getElementById('archiveName').textContent;

        if (!documentName || !archiveName || !archivePassword) {
            alert('Document name and archive name are required, and ensure the archive is opened with a password.');
            return;
        }

        fetch(archiveServer + `/retrieve?fullname=${encodeURIComponent(documentName)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Archive': archiveName,
                'Password': archivePassword
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Unknown error');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.body) {
                editorInstance.setData(data.body);
                document.getElementById('nameField').value = data.name;
                if (data.timeupdated) {
                    document.getElementById('timeUpdated').innerText = `Last saved: ${data.timeupdated}`;
                }
                if (data.incominglinks) {
                    document.getElementById('incomingLinks').innerText = "";
                    const incomingLinkSection = buildIncomingList(data.incominglinks);
                    document.getElementById('incomingLinks').appendChild(incomingLinkSection);
                }
                setOutgoingLinks(data.body);
                isContentChanged = false;
                console.log('Document loaded successfully:', data);
            } else {
                alert('Error: Document not found.');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error loading document: ' + error.message);
        });
    }

    function createNewArchive() {
        const archiveName = prompt('Enter new archive name:');
        const password = prompt('Enter new archive password:');

        if (!archiveName || !password) {
            alert('Archive name and password are required.');
            return;
        }

        fetch(archiveServer + '/create_archive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Archive': archiveName,
                'Password': password
            },
            body: JSON.stringify({})
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Unknown error');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Archive created successfully:', data);
            alert('Archive created successfully.');
            document.getElementById('archiveName').textContent = archiveName;
            archivePassword = password;
            clearEditorFields();
            loadTreeData();
        })
        .catch((error) => {
            console.error('Error creating archive:', error);
            alert('Error creating archive: ' + error.message);
        });
    }

    function openArchiveDialog() {
        let serverName = prompt('Enter SERVER name (Enter for https://klinkserver.azurewebsites.net):');
        const archiveName = prompt('Enter ARCHIVE name:');
        const password = prompt('Enter archive PASSWORD:');

        if (!serverName) {
            serverName = archiveServer;
        }

        if (!archiveName || !password) {
            alert('Archive name and password are required.');
            return;
        }

        fetch(archiveServer + '/documents', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Archive': archiveName,
                'Password': password
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Unknown error');
                });
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('archiveName').textContent = archiveName;
            archivePassword = password; // Store the password for future use
            clearEditorFields();
            const treeContainer = document.getElementById('treeContainer');
            treeContainer.innerHTML = '';
            const tree = buildTree(data);
            treeContainer.appendChild(tree);
            archiveServer = serverName;
        })
        .catch(error => {
            console.error('Error loading tree data:', error);
            alert('Error loading archive: ' + error.message);
        });
    }

    function deleteArchive() {
        const archiveName = document.getElementById('archiveName').textContent;

        if (!archiveName || !archivePassword) {
            alert('Archive name and password are required.');
            return;
        }

        const confirmation = confirm('Are you sure you want to delete this archive? This action cannot be undone.');
        if (!confirmation) return;

        fetch(archiveServer + '/delete_archive', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Archive': archiveName,
                'Password': archivePassword
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Unknown error');
                });
            }
            alert('Archive deleted successfully.');
            document.getElementById('archiveName').textContent = 'None';
            document.getElementById('treeContainer').innerHTML = '';
            clearEditorFields();
            archivePassword = null; // Clear the stored password
        })
        .catch(error => {
            console.error('Error deleting archive:', error);
            alert('Error deleting archive: ' + error.message);
        });
    }

    function createNewDocument() {
        const documentName = prompt('Enter new document name:');
        const archiveName = document.getElementById('archiveName').textContent;

        if (!documentName || !archiveName || !archivePassword) {
            alert('Document name, archive name, and password are required.');
            return;
        }

        fetch(archiveServer + '/insert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Archive': archiveName,
                'Password': archivePassword
            },
            body: JSON.stringify({ name: documentName, body: '' })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Unknown error');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Document created successfully:', data);
            editorInstance.setData('');
            document.getElementById('nameField').value = documentName;
            document.getElementById('timeUpdated').innerText = '';
            document.getElementById('incomingLinks').innerText = '';
            setOutgoingLinks('');
            loadTreeData();
        })
        .catch((error) => {
            console.error('Error creating document:', error);
            alert('Error creating document: ' + error.message);
        });
    }

    function deleteDocument() {
        const documentName = document.getElementById('nameField').value;
        const archiveName = document.getElementById('archiveName').textContent;

        if (!documentName || !archiveName || !archivePassword) {
            alert('Document name, archive name, and password are required.');
            return;
        }

        const confirmation = confirm('Are you sure you want to delete this document? This action cannot be undone.');
        if (!confirmation) return;

        fetch(archiveServer + '/delete_document', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Archive': archiveName,
                'Password': archivePassword
            },
            body: JSON.stringify({ name: documentName })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Unknown error');
                });
            }
            alert('Document deleted successfully.');
            clearEditorFields();
            loadTreeData();
        })
        .catch(error => {
            console.error('Error deleting document:', error);
            alert('Error deleting document: ' + error.message);
        });
    }

    function loadTreeData() {
        const archiveName = document.getElementById('archiveName').textContent;

        if (!archiveName || !archivePassword) {
            openArchiveDialog();
            return;
        }

        fetch(archiveServer + '/documents', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Archive': archiveName,
                'Password': archivePassword
            }
        })
        .then(response => response.json())
        .then(data => {
            const treeContainer = document.getElementById('treeContainer');
            treeContainer.innerHTML = '';
            const tree = buildTree(data);
            treeContainer.appendChild(tree);
        })
        .catch(error => {
            console.error('Error loading tree data:', error);
        });
    }

    function buildTree(data) {
        const root = document.createElement('div');

        const folders = {};
        data.forEach(item => {
            const folder = item.path || '';
            const name = item.name;
            if (!folders[folder]) {
                folders[folder] = [];
            }
            folders[folder].push(name);
        });

        for (const [folder, files] of Object.entries(folders)) {
            const folderElement = document.createElement('div');
            folderElement.className = 'tree-folder';
            folderElement.innerText = (folder || '(Root)') + ':';

            files.forEach(file => {
                const fileElement = document.createElement('div');
                fileElement.className = 'tree-item';
                fileElement.innerText = file;
                fileElement.addEventListener('click', () => {
                    openDocumentByName(`${folder}/${file}`);
                });
                folderElement.appendChild(fileElement);
            });

            root.appendChild(folderElement);
        }

        return root;
    }

    function buildOutgoingList(inLinkString) {
        const root = document.createElement('div');
        root.innerHTML = "Outgoing links: ";
        const linksArray = inLinkString.split(',');

        linksArray.forEach(item => {
            const linkElement = document.createElement('a');
            linkElement.className = 'outgoing-item';
            linkElement.innerText = item;
            linkElement.addEventListener('click', () => {
                openDocumentByName(`${item}`);
            });
            root.appendChild(linkElement);
        });

        return root;
    }

    function buildIncomingList(inLinkString) {
        const root = document.createElement('div');
        root.innerHTML = "Referenced by: ";
        const linksArray = inLinkString.split(',');

        linksArray.forEach(item => {
            const linkElement = document.createElement('a');
            linkElement.className = 'incoming-item';
            linkElement.innerText = '<==' + item;
            linkElement.addEventListener('click', () => {
                openDocumentByName(`${item}`);
            });
            root.appendChild(linkElement);
        });

        return root;
    }

    function openDocumentByName(documentName) {
        const archiveName = document.getElementById('archiveName').textContent;

        if (!archiveName || !archivePassword) {
            alert('Archive name and password are required.');
            return;
        }

        fetch(archiveServer + `/retrieve?fullname=${encodeURIComponent(documentName)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Archive': archiveName,
                'Password': archivePassword
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Unknown error');
                });
            }
            return response.json();
        })
        .then(data => {
            editorInstance.setData(data.body);
            document.getElementById('nameField').value = data.name;
            if (data.timeupdated) {
                document.getElementById('timeUpdated').innerText = `Last saved: ${data.timeupdated}`;
            } else {
                document.getElementById('timeUpdated').innerText = '';
            }
            if (data.incominglinks) {
                document.getElementById('incomingLinks').innerText = '';
                const incomingLinkSection = buildIncomingList(data.incominglinks);
                document.getElementById('incomingLinks').appendChild(incomingLinkSection);
            } else {
                document.getElementById('incomingLinks').innerText = '';
            }
            setOutgoingLinks(data.body);
            isContentChanged = false;
            console.log('Document loaded successfully:', data);
        })
        .catch((error) => {
            const createNew = confirm("This document does not exist yet. Do you want to create a new document?");
            if (createNew) {
                document.getElementById('nameField').value = documentName;
                editorInstance.setData('');
                document.getElementById('incomingLinks').innerText = '';
                document.getElementById('timeUpdated').innerText = '';
                setOutgoingLinks('');
                isContentChanged = false;
                console.log('Ready to create a new document:', documentName);
            }
        });
    }

    function filterDocuments() {
        const filter = document.getElementById('searchField').value.toLowerCase();
        const treeItems = document.querySelectorAll('.tree-item');
        treeItems.forEach(item => {
            const text = item.innerText.toLowerCase();
            item.style.display = text.includes(filter) ? '' : 'none';
        });
    }

    function extractOutgoingLinks(content) {
        const linkPattern = /\[\[([^\]]+)\]\]/g;
        let matches;
        const links = [];

        while ((matches = linkPattern.exec(content)) !== null) {
            if (!links.includes(matches[1])) {
                links.push(matches[1]);
            }
        }

        return links.join(',');
    }

    function clearEditorFields() {
        editorInstance.setData('');
        document.getElementById('nameField').value = '';
        document.getElementById('incomingLinks').innerText = '';
        document.getElementById('outgoingLinks').innerText = '';
        document.getElementById('timeUpdated').innerText = '';
        isContentChanged = false;
    }

    // Make functions available globally
    window.openArchiveDialog = openArchiveDialog;
    window.createNewArchive = createNewArchive;
    window.deleteArchive = deleteArchive;
    window.openDocument = openDocument;
    window.createNewDocument = createNewDocument;
    window.deleteDocument = deleteDocument;
    window.filterDocuments = filterDocuments;
});
