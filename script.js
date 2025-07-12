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
        folderContainer.style.marginLeft = `${depth * 15}px`;
    }
    
    const folderHeader = document.createElement('div');
    folderHeader.className = 'tree-header';
    
    // Use different tree characters based on whether there are root files
    let treeChar;
    if (hasRootFiles && depth === 0) {
        treeChar = isLast ? '└─ ' : '├─ ';
    } else {
        treeChar = isLast ? '└─ ' : '├─ ';
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
    treeChar.textContent = isLast ? '└─ ' : '├─ ';
    
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
        
        const repoLink = document.createElement('a');
        repoLink.href = 'https://eemax.github.io/';
        repoLink.textContent = `${repoName}/`;
        repoLink.className = 'repo-link';
        
        repoHeader.appendChild(repoLink);
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

        // Add bottom spacer for mobile and iPad to ensure scrollable area
        if (window.innerWidth <= 768 || /iPad|iPhone|iPod/.test(navigator.userAgent)) {
            const spacer = document.createElement('div');
            spacer.style.height = '200px';
            spacer.style.width = '100%';
            notesListEl.appendChild(spacer);
        }

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
 * Converts YAML to GitHub-style table format
 */
function yamlToTable(yamlText) {
    const lines = yamlText.split('\n');
    const tableRows = [];
    
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex > 0) {
                const key = trimmedLine.substring(0, colonIndex).trim();
                let value = trimmedLine.substring(colonIndex + 1).trim();
                
                // Handle array values
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.replace(/[\[\]]/g, '').split(',').map(item => 
                        `<code>${item.trim()}</code>`
                    ).join(', ');
                }
                // Handle empty values
                else if (!value) {
                    value = '<em>empty</em>';
                }
                // Handle boolean values
                else if (value === 'true' || value === 'false') {
                    value = `<code>${value}</code>`;
                }
                // Handle quoted strings
                else if ((value.startsWith('"') && value.endsWith('"')) || 
                         (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                // Handle other values
                else {
                    value = `<code>${value}</code>`;
                }
                
                tableRows.push(`| ${key} | ${value} |`);
            }
        }
    });
    
    if (tableRows.length > 0) {
        return `| Key | Value |\n| --- | --- |\n${tableRows.join('\n')}\n\n`;
    }
    
    return '';
}

/**
 * Processes internal note links to use hash-based navigation
 */
function processInternalLinks(markdownText) {
    // Convert internal note links from [text](path.md) to [text](#path.md)
    return markdownText.replace(/\[([^\]]+)\]\(([^)]+\.md)\)/g, '[$1](#$2)');
}

/**
 * Processes YAML frontmatter to make it renderable
 */
function processYamlFrontmatter(markdownText) {
    try {
        // Check if the content starts with YAML frontmatter (--- on first line)
        const lines = markdownText.split('\n');
        if (lines.length > 0 && lines[0].trim() === '---') {
            // Find the closing ---
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '---') {
                    // Extract frontmatter and content
                    const frontmatter = lines.slice(1, i).join('\n');
                    const content = lines.slice(i + 1).join('\n');
                    
                    // Convert frontmatter to GitHub-style table
                    const tableFrontmatter = yamlToTable(frontmatter);
                    
                    return tableFrontmatter + content;
                }
            }
            // If we found opening --- but no closing ---, treat the whole thing as content
            console.warn('YAML frontmatter not properly closed, treating as regular content');
        }
    } catch (error) {
        console.error('Error processing YAML frontmatter:', error);
    }
    // If no frontmatter found or error occurred, return original content
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

    console.log('Attempting to load note:', notePath);
    console.log('Current URL:', window.location.href);
    
    // Use GitHub raw content URL
    const githubRawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${notePath}`;
    console.log('Full fetch URL:', githubRawUrl);

    try {
        const response = await fetch(githubRawUrl);
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Note not found. Status: ${response.status} ${response.statusText}`);
        }
        const markdownText = await response.text();
        
        // Process YAML frontmatter to make it renderable
        let processedMarkdown = processYamlFrontmatter(markdownText);
        
        // Process internal note links
        processedMarkdown = processInternalLinks(processedMarkdown);
        
        try {
            contentEl.innerHTML = marked.parse(processedMarkdown);
        } catch (parseError) {
            console.error('Markdown parsing error:', parseError);
            console.error('Processed markdown:', processedMarkdown);
            // Fallback to raw text if parsing fails
            contentEl.innerHTML = `<pre>${processedMarkdown}</pre>`;
        }
        
        // Update mobile title with note name
        updateMobileTitle(notePath);
        
        // Add copy buttons to code blocks after rendering
        addCopyButtonsToCodeBlocks();
    } catch (error) {
        console.error('Error loading note:', error);
        contentEl.innerHTML = `<p style="color:red;">Error: Could not load note. ${error.message}</p>`;
    }
}

// --- Mobile Menu Functions ---

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
}

function updateMobileTitle(notePath) {
    const mobileTitle = document.getElementById('mobile-title');
    if (mobileTitle) {
        if (notePath) {
            // Extract filename from path, remove .md extension, and decode URL encoding
            const fileName = notePath.split('/').pop().replace('.md', '');
            const decodedFileName = decodeURIComponent(fileName);
            mobileTitle.textContent = decodedFileName;
        } else {
            mobileTitle.textContent = 'Notes';
        }
    }
}

// --- Event Listeners ---

// Re-load the note content when the URL hash changes (user clicks a link)
window.addEventListener('hashchange', () => {
    loadNote();
    // Re-apply iOS scroll fix when navigating
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        setTimeout(() => {
            document.getElementById('sidebar').style.webkitOverflowScrolling = 'touch';
            document.getElementById('content').style.webkitOverflowScrolling = 'touch';
        }, 100);
    }
});

// Build the menu and load the initial note when the page first loads
document.addEventListener('DOMContentLoaded', () => {
    buildMenu();
    
    // Mobile menu event listeners
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const overlay = document.getElementById('mobile-overlay');
    
    mobileToggle.addEventListener('click', () => {
        toggleMobileMenu();
        // Re-apply iOS scroll fix when opening mobile menu
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            setTimeout(() => {
                document.getElementById('sidebar').style.webkitOverflowScrolling = 'touch';
            }, 100);
        }
    });
    overlay.addEventListener('click', closeMobileMenu);
    
    // Close mobile menu when clicking on a file link
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('file-link')) {
            closeMobileMenu();
        }
    });
    
    // Simple iOS scroll fix
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        setTimeout(() => {
            document.getElementById('sidebar').style.webkitOverflowScrolling = 'touch';
            document.getElementById('content').style.webkitOverflowScrolling = 'touch';
        }, 100);
    }
});