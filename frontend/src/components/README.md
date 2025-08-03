# Components Documentation

## FileManager Components

The FileManager components provide a complete file management interface with modern UI/UX and 3-dot menu functionality.

### Components

#### FileManager

The main component that combines FileToolbar and FileList to provide a complete file management interface.

**Props:**

- `files` - Array of file objects
- `folders` - Array of folder objects
- `loading` - Boolean for loading state
- `error` - Error message string
- `viewMode` - 'list' or 'grid' view mode
- `searchQuery` - Current search query
- `searchFilter` - Current filter ('all', 'files', 'folders', 'shared', 'recent')
- `searchSort` - Current sort ('name', 'date', 'size', 'type')
- `onSearch` - Search callback function
- `onViewModeChange` - View mode change callback
- `onFilterChange` - Filter change callback
- `onSortChange` - Sort change callback
- `onRefresh` - Refresh callback
- `onUpload` - Upload callback
- `onCreateFolder` - Create folder callback
- `onView` - View file/folder callback
- `onDownload` - Download callback
- `onShare` - Share callback
- `onRename` - Rename callback
- `onCopy` - Copy callback
- `onMove` - Move callback
- `onDelete` - Delete callback
- `onPermissions` - Permissions callback

#### FileItem

Individual file or folder item with 3-dot menu for actions.

**Features:**

- List and grid view support
- 3-dot menu with file actions
- Hover effects and animations
- Selection support
- File type icons
- Shared/Public status indicators

#### FileList

Container component that displays files and folders in either list or grid view.

#### FileToolbar

Toolbar component with search, filters, view mode toggle, and action buttons.

### Usage Example

```jsx
import FileManager from "../components/FileManager/FileManager";

const MyPage = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [viewMode, setViewMode] = useState("list");

  const handleFileAction = (action, item) => {
    switch (action) {
      case "view":
        console.log("View:", item);
        break;
      case "download":
        console.log("Download:", item);
        break;
      // ... other actions
    }
  };

  return (
    <FileManager
      files={files}
      folders={folders}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onView={(item) => handleFileAction("view", item)}
      onDownload={(item) => handleFileAction("download", item)}
      onShare={(item) => handleFileAction("share", item)}
      onRename={(item) => handleFileAction("rename", item)}
      onCopy={(item) => handleFileAction("copy", item)}
      onMove={(item) => handleFileAction("move", item)}
      onDelete={(item) => handleFileAction("delete", item)}
      onPermissions={(item) => handleFileAction("permissions", item)}
    />
  );
};
```

### File/Folder Object Structure

```javascript
{
  id: 1,
  name: 'document.pdf',
  type: 'file', // or 'folder'
  size: '2.5 MB',
  shared: true,
  isPublic: false,
  // ... other properties
}
```

## Layout Components

### Layout

Main layout component that provides the overall structure with sidebar and header.

### Sidebar

Navigation sidebar with user info, storage usage, and menu items.

### Header

Top header with page title, search, notifications, and user menu.

## Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Modern UI/UX**: Clean, modern interface with smooth animations
- **3-Dot Menu**: Context menu for file/folder actions
- **Multiple View Modes**: List and grid views
- **Search & Filter**: Advanced search and filtering capabilities
- **Selection Support**: Multi-select functionality
- **Accessibility**: Keyboard navigation and screen reader support
- **Customizable**: Highly configurable through props
- **Reusable**: Modular components that can be used anywhere

## Styling

All components use Material-UI (MUI) for consistent styling and theming. The components follow the design system with:

- Consistent spacing and typography
- Smooth transitions and animations
- Hover effects and visual feedback
- Color-coded status indicators
- Modern card-based layouts
