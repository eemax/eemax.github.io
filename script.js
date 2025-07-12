// --- Configuration ---
// IMPORTANT: Replace these with your own GitHub username and repository name
const repoOwner = 'eemax';
const repoName = 'eemax.github.io';

// --- Global Variables ---
const contentEl = document.getElementById('content');
const notesListEl = document.getElementById('notes-list');

// --- Main Functions ---

/**
 * Groups files by their folder structure
 */
function groupFilesByFolder(files) {
    const folders = {};
    const rootFiles = [];
    
    files.forEach(file => {
        const pathParts = file.path.split('/');
        
        if (pathParts.length === 1) {
            // File is in root directory
            rootFiles.push(file);
        } else {
            // File is in a folder
            const folderName = pathParts[0];
            if (!folders[folderName]) {
                folders[folderName] = [];
            }
            folders[folderName].push(file);
        }
    });
    
    return { folders, rootFiles };
}

/**
 * Creates a folder tree item with expand/collapse functionality
 */
function createFolderTreeItem(folderName, files, isLast = false) {
    const folderContainer = document.createElement('div');
    folderContainer.className = 'tree-item folder-item';
    
    const folderHeader = document.createElement('div');
    folderHeader.className = 'tree-header';
    folderHeader.innerHTML = `
        <span class="tree-toggle">${isLast ? '└── ' : '├── '}</span>
        <span class="folder-name">${folderName}/</span>
    `;
    
    const folderContent = document.createElement('div');
    folderContent.className = 'tree-content';
    folderContent.style.display = 'none'; // Start closed
    
    // Add files to folder content
    const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path));
    sortedFiles.forEach((file, index) => {
        const isLastFile = index === sortedFiles.length - 1;
        const fileItem = createFileTreeItem(file, isLastFile);
        folderContent.appendChild(fileItem);
    });
    
    // Add click handler for expand/collapse
    folderHeader.addEventListener('click', () => {
        const isExpanded = folderContent.style.display !== 'none';
        folderContent.style.display = isExpanded ? 'none' : 'block';
        folderHeader.querySelector('.tree-toggle').textContent = isExpanded ? 
            (isLast ? '└── ' : '├── ') : 
            (isLast ? '└── ' : '├── ');
    });
    
    folderContainer.appendChild(folderHeader);
    folderContainer.appendChild(folderContent);
    
    return folderContainer;
}

/**
 * Creates a file tree item
 */
function createFileTreeItem(file, isLast = false) {
    const fileContainer = document.createElement('div');
    fileContainer.className = 'tree-item file-item';
    
    const noteLink = document.createElement('a');
    noteLink.href = `#${file.path}`;
    noteLink.textContent = `${isLast ? '└── ' : '├── '}${file.path.split('/').pop().replace('.md', '')}`;
    noteLink.className = 'file-link';
    
    fileContainer.appendChild(noteLink);
    return fileContainer;
}

/**
 * Creates root files section
 */
function createRootFilesSection(rootFiles) {
    const rootContainer = document.createElement('div');
    rootContainer.className = 'tree-item root-section';
    
    const sortedRootFiles = rootFiles.sort((a, b) => a.path.localeCompare(b.path));
    
    sortedRootFiles.forEach((file, index) => {
        const isLastFile = index === sortedRootFiles.length - 1;
        const fileItem = createFileTreeItem(file, isLastFile);
        rootContainer.appendChild(fileItem);
    });
    
    return rootContainer;
}

/**
 * Fetches the list of files from the GitHub repository,
 * filters for Markdown files, and builds the navigation menu.
 */
async function buildMenu() {
    try {
        // Fetch the repository's file tree from the GitHub API
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/main?recursive=1`);
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }
        const data = await response.json();

        // Filter the list to include only Markdown (.md) files
        const markdownFiles = data.tree.filter(file => file.path.endsWith('.md'));

        if (markdownFiles.length === 0) {
            notesListEl.innerHTML = '<li>No .md files found in repository.</li>';
            return;
        }

        // Group files by folder
        const { folders, rootFiles } = groupFilesByFolder(markdownFiles);

        // Clear the notes list
        notesListEl.innerHTML = '';

        // Add repository name as root
        const repoHeader = document.createElement('div');
        repoHeader.className = 'repo-header';
        repoHeader.textContent = `${repoName}/`;
        notesListEl.appendChild(repoHeader);

        // Add folders first (sorted alphabetically)
        const folderNames = Object.keys(folders).sort();
        folderNames.forEach((folderName, index) => {
            const isLastFolder = index === folderNames.length - 1 && rootFiles.length === 0;
            const folderContainer = createFolderTreeItem(folderName, folders[folderName], isLastFolder);
            notesListEl.appendChild(folderContainer);
        });

        // Add root files
        if (rootFiles.length > 0) {
            const rootSection = createRootFilesSection(rootFiles);
            notesListEl.appendChild(rootSection);
        }

        // After building the menu, load the note specified in the URL (or the first one)
        loadNote();

    } catch (error) {
        notesListEl.innerHTML = `<p style="color:red;">Error building menu: ${error.message}</p>`;
        console.error(error);
    }
}

/**
 * Fetches the content of a specific Markdown file and renders it.
 */
async function loadNote() {
    // Get the file path from the URL hash. If empty, do nothing until a link is clicked.
    const notePath = window.location.hash.substring(1);
    
    if (!notePath) {
        contentEl.innerHTML = "<p>Select a note from the list to view it.</p>";
        return;
    }

    try {
        const response = await fetch(notePath);
        if (!response.ok) {
            throw new Error("Note not found.");
        }
        const markdownText = await response.text();
        contentEl.innerHTML = marked.parse(markdownText);
    } catch (error) {
        contentEl.innerHTML = `<p style="color:red;">Error: Could not load note.</p>`;
    }
}

// --- Event Listeners ---

// Re-load the note content when the URL hash changes (user clicks a link)
window.addEventListener('hashchange', loadNote);

// Build the menu and load the initial note when the page first loads
document.addEventListener('DOMContentLoaded', buildMenu);