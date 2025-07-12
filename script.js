// --- Configuration ---
// IMPORTANT: Replace these with your own GitHub username and repository name
const repoOwner = 'eemax';
const repoName = 'eemax.github.io';

// --- Global Variables ---
const contentEl = document.getElementById('content');
const notesListEl = document.getElementById('notes-list');

// --- Main Functions ---

/**
 * Groups files by their folder structure, handling nested folders
 */
function groupFilesByFolder(files) {
    const rootFiles = [];
    const folderStructure = {};
    
    files.forEach(file => {
        const pathParts = file.path.split('/');
        
        if (pathParts.length === 1) {
            // File is in root directory
            rootFiles.push(file);
        } else {
            // File is in a folder structure
            const folderName = pathParts[0];
            if (!folderStructure[folderName]) {
                folderStructure[folderName] = {
                    files: [],
                    subfolders: {}
                };
            }
            
            if (pathParts.length === 2) {
                // File is directly in this folder
                folderStructure[folderName].files.push(file);
            } else {
                // File is in a subfolder
                const subfolderPath = pathParts.slice(1, -1).join('/');
                const fileName = pathParts[pathParts.length - 1];
                
                // Create nested structure
                let currentLevel = folderStructure[folderName].subfolders;
                const subfolderParts = subfolderPath.split('/');
                
                subfolderParts.forEach(part => {
                    if (!currentLevel[part]) {
                        currentLevel[part] = {
                            files: [],
                            subfolders: {}
                        };
                    }
                    currentLevel = currentLevel[part];
                });
                
                // Add the file to the deepest level
                currentLevel.files.push(file);
            }
        }
    });
    
    return { folders: folderStructure, rootFiles };
}

/**
 * Creates a folder tree item with expand/collapse functionality
 */
function createFolderTreeItem(folderName, folderData, isLast = false, hasRootFiles = false, depth = 0) {
    const folderContainer = document.createElement('div');
    folderContainer.className = 'tree-item folder-item';
    if (depth > 0) {
        folderContainer.className += ' nested';
        folderContainer.style.marginLeft = `${depth * 20}px`;
    }
    
    const folderHeader = document.createElement('div');
    folderHeader.className = 'tree-header';
    
    // Use different tree characters based on whether there are root files
    let treeChar;
    if (hasRootFiles && depth === 0) {
        treeChar = isLast ? '└── ' : '├── ';
    } else {
        treeChar = isLast ? '└── ' : '├── ';
    }
    
    folderHeader.innerHTML = `
        <span class="tree-toggle">${treeChar}</span>
        <span class="folder-name">${folderName}/</span>
    `;
    
    const folderContent = document.createElement('div');
    folderContent.className = 'tree-content';
    folderContent.style.display = 'none'; // Start closed
    
    // Add files to folder content with proper indentation
    const sortedFiles = folderData.files.sort((a, b) => a.path.localeCompare(b.path));
    sortedFiles.forEach((file, index) => {
        const isLastFile = index === sortedFiles.length - 1 && Object.keys(folderData.subfolders).length === 0;
        const fileItem = createFileTreeItem(file, isLastFile, true); // Indent files inside folders
        folderContent.appendChild(fileItem);
    });
    
    // Add subfolders
    const subfolderNames = Object.keys(folderData.subfolders).sort();
    subfolderNames.forEach((subfolderName, index) => {
        const isLastSubfolder = index === subfolderNames.length - 1;
        const subfolderContainer = createFolderTreeItem(
            subfolderName, 
            folderData.subfolders[subfolderName], 
            isLastSubfolder, 
            false, 
            depth + 1
        );
        folderContent.appendChild(subfolderContainer);
    });
    
    // Add click handler for expand/collapse
    folderHeader.addEventListener('click', () => {
        const isExpanded = folderContent.style.display !== 'none';
        folderContent.style.display = isExpanded ? 'none' : 'block';
        folderHeader.querySelector('.tree-toggle').textContent = isExpanded ? 
            treeChar : treeChar;
    });
    
    folderContainer.appendChild(folderHeader);
    folderContainer.appendChild(folderContent);
    
    return folderContainer;
}

/**
 * Creates a file tree item
 */
function createFileTreeItem(file, isLast = false, isIndented = false) {
    const fileContainer = document.createElement('div');
    fileContainer.className = 'tree-item file-item';
    if (isIndented) {
        fileContainer.className += ' indented';
    }
    
    // Create tree character span
    const treeChar = document.createElement('span');
    treeChar.className = 'tree-char';
    treeChar.textContent = isLast ? '└── ' : '├── ';
    
    // Create filename link
    const noteLink = document.createElement('a');
    noteLink.href = `#${file.path}`;
    noteLink.textContent = file.path.split('/').pop().replace('.md', '');
    noteLink.className = 'file-link';
    
    fileContainer.appendChild(treeChar);
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
        // Always use connecting line for last root file since we expect folders to follow
        const fileItem = createFileTreeItem(file, false);
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

        // Add root files first
        if (rootFiles.length > 0) {
            const rootSection = createRootFilesSection(rootFiles);
            notesListEl.appendChild(rootSection);
        }

        // Add folders after root files (sorted alphabetically)
        const folderNames = Object.keys(folders).sort();
        folderNames.forEach((folderName, index) => {
            const isLastFolder = index === folderNames.length - 1;
            const hasRootFiles = rootFiles.length > 0;
            const folderContainer = createFolderTreeItem(folderName, folders[folderName], isLastFolder, hasRootFiles);
            notesListEl.appendChild(folderContainer);
        });

        // After building the menu, load the note specified in the URL (or the first one)
        loadNote();

    } catch (error) {
        notesListEl.innerHTML = `<p style="color:red;">Error building menu: ${error.message}</p>`;
        console.error(error);
    }
}

/**
 * Adds copy buttons to code blocks
 */
function addCopyButtonsToCodeBlocks() {
    const codeBlocks = contentEl.querySelectorAll('pre');
    
    codeBlocks.forEach((pre, index) => {
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/>
                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/>
            </svg>
        `;
        
        // Position the button
        pre.style.position = 'relative';
        pre.appendChild(copyButton);
        
        // Add click handler
        copyButton.addEventListener('click', async () => {
            const code = pre.querySelector('code');
            const textToCopy = code ? code.textContent : pre.textContent;
            
            try {
                await navigator.clipboard.writeText(textToCopy);
                
                // Show success feedback
                copyButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                    </svg>
                `;
                copyButton.classList.add('copied');
                
                // Reset after 2 seconds
                setTimeout(() => {
                    copyButton.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/>
                            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/>
                        </svg>
                    `;
                    copyButton.classList.remove('copied');
                }, 2000);
                
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        });
    });
}

/**
 * Processes YAML frontmatter to make it renderable
 */
function processYamlFrontmatter(markdownText) {
    // Check if the content starts with YAML frontmatter (--- on first line)
    const lines = markdownText.split('\n');
    if (lines[0].trim() === '---') {
        // Find the closing ---
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                // Extract frontmatter and content
                const frontmatter = lines.slice(1, i).join('\n');
                const content = lines.slice(i + 1).join('\n');
                
                // Convert frontmatter to a formatted code block
                const processedFrontmatter = `\`\`\`yaml\n${frontmatter}\n\`\`\`\n\n`;
                
                return processedFrontmatter + content;
            }
        }
    }
    // If no frontmatter found, return original content
    return markdownText;
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
        
        // Process YAML frontmatter to make it renderable
        const processedMarkdown = processYamlFrontmatter(markdownText);
        
        contentEl.innerHTML = marked.parse(processedMarkdown);
        
        // Add copy buttons to code blocks after rendering
        addCopyButtonsToCodeBlocks();
    } catch (error) {
        contentEl.innerHTML = `<p style="color:red;">Error: Could not load note.</p>`;
    }
}

// --- Event Listeners ---

// Re-load the note content when the URL hash changes (user clicks a link)
window.addEventListener('hashchange', loadNote);

// Build the menu and load the initial note when the page first loads
document.addEventListener('DOMContentLoaded', buildMenu);