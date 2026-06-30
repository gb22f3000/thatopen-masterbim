# Architectural Explanation & Technical Documentation

This document explains the architecture, structure, and functional workflows of the **Master BIM Software Developer** application.

---

## 1. Overview
The application is a comprehensive, modern **Building Information Modeling (BIM)** software platform. It allows users to manage multiple construction/architecture projects, inspect 3D IFC models directly in the browser, calculate material quantities, and manage project-related issues (To-Dos) linked directly to 3D elements.

### Architecture At A Glance
```mermaid
graph TD
    A[index.tsx - Entry Point] --> B[BrowserRouter & Routes]
    B --> C[ProjectsPage]
    B --> D[ProjectDetailsPage]
    B --> E[UsersPage]
    
    C --> F[ProjectsManager - State Layer]
    D --> F
    
    D --> G[IFCViewer - 3D Engine]
    G --> H[@thatopen/components & Three.js]
    
    G --> I[SimpleQTO - Quantity Take Off]
    G --> J[TodoCreator - Visual Issues Tracker]
    
    C --> K[Firebase Firestore]
    D --> K
```

---

## 2. Core Technology Stack

1. **Vite + React + TypeScript:** The core application wrapper, serving components rapidly with typed safety.
2. **Three.js:** The underlying 3D graphics library delivering high-performance WebGL rendering.
3. **@thatopen/components (formerly IFC.js):** The primary BIM engine which loads, parses, indexes, and queries IFC structures and geometries.
4. **@thatopen/ui & @thatopen/ui-obc:** Web Components built specifically for BIM interfaces (toolbars, tables, panels, viewport) that run seamlessly within the React layer.
5. **Firebase Firestore:** The persistent cloud database used to fetch, update, and delete project configurations.

---

## 3. Directory Structure & Key Files

### 📁 `src/`
- **[index.tsx](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/index.tsx)**
  - Initializer for `@thatopen/ui` (`BUI.Manager.init()`).
  - Sets up routing (`/` to list projects, `/project/:id` for details, `/users` for user management).
  - Listens for modal events (e.g. creating a new project form submission).

### 📁 `src/class/` (Business Logic & State Management)
- **[Project.ts](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/class/Project.ts)**
  - Defines the `IProject` interface and `Project` class model.
  - Defines roles (`architect`, `engineer`, `developer`) and statuses (`pending`, `active`, `finished`).
- **[ProjectsManager.ts](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/class/ProjectsManager.ts)**
  - Manages the local array list of projects.
  - Handles business validation (e.g. project name uniqueness, length).
  - Handles project file serialization (import/export to JSON files).
- **[UIManager.ts](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/class/UIManager.ts)**
  - Manage modal states, tabs toggles, and popup error dialogs.

### 📁 `src/firebase/` (Data Persistence)
- **[index.ts](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/firebase/index.ts)**
  - Configures and initializes connection to Firebase Firestore.
  - Exposes wrapper CRUD queries (`getCollection`, `deleteDocument`, `updateDocument`).

### 📁 `src/react-components/` (UI Views & Components)
- **[ProjectsPage.tsx](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/react-components/ProjectsPage.tsx)**
  - Pulls existing projects from Firebase Firestore on load.
  - Mounts components to register new projects and filter the collection.
- **[ProjectDetailsPage.tsx](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/react-components/ProjectDetailsPage.tsx)**
  - Houses the dashboard summary (Status, Cost, Role, Finish Date, Progress Bar).
  - Mounts the `IFCViewer` 3D component.
  - Integrates the project To-Do table (list of issues tracked on the model).
- **[IFCViewer.tsx](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/react-components/IFCViewer.tsx)**
  - Configures the Three.js scene, cameras, ortho-perspective views, and Post-production rendering effects.
  - Sets up the `IfcLoader` and `FragmentsManager` for model uploading/rendering.
  - Configures UI layouts (`main`, `second`, `world`, `classifier`, `qtos`) for the interactive floating viewport overlay.

### 📁 `src/bim-components/` (Custom BIM Plugins)
- **[SimpleQTO](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/bim-components/SimpleQTO/src/SimpleQTO.ts)**
  - Custom component querying material quantities.
  - Recursively fetches `IsDefinedBy` relationship properties of the active 3D element, mapping entities like `IFCELEMENTQUANTITY` to values and calculating summary counts.
- **[TodoCreator](file:///c:/Users/Gautam%20Bhardwaj/Desktop/thatopen-masterbim-main/src/bim-components/TodoCreator/src/TodoCreator.ts)**
  - Creates, highlights, and deletes issues tied to elements in the 3D model.
  - Saves the active camera coordinate position (location and targets) when an issue is created. Selecting the issue later animates/positions the camera back to that exact perspective.
  - Places 3D marker pins (`OBCF.Mark`) directly above the components.

---

## 4. Key Workflows Explained

### Workflow A: Loading & Rendering a 3D IFC Model
1. The user goes to a project details page, opening the `IFCViewer` component.
2. Clicking **Load IFC** (or dragging a `.frag` model) activates the `IfcLoader` or `FragmentsManager`.
3. Geometries are compiled into optimized fragments (`FragmentsGroup`), loaded to the Three.js scene, and processed via the `IfcRelationsIndexer`.
4. The `Classifier` organizes components by spatial structures (buildings, levels, rooms) and entities (walls, slabs, doors), populating the **Classification Tree**.

### Workflow B: Managing To-Dos & Visual Issues
1. With a model loaded, the user selects components using the 3D Highlighter.
2. The user clicks **Add Todo**, providing a description and priority (Low, Medium, High).
3. The `TodoCreator` fetches the selected elements' GUIDs, grabs camera coordinates via camera controls, and appends a `TodoData` object.
4. A 3D pin marker is spawned on the geometry's bounding box center.
5. In the To-Do list, clicking an issue row triggers `todoCreator.highlightTodo(todo)`, resetting the camera focus and selection highlights directly onto the mapped element.

### Workflow C: Quantity Take Off (QTO) Calculations
1. The user selects a 3D element in the viewport.
2. The `Highlighter` selection trigger calls `simpleQTO.sumQuantities(selection)`.
3. The component inspects the properties dictionary of the selected expressID, aggregates matching metrics (like volume, area, weight), and updates the **Quantities Panel**.

---

## 5. Potential Enhancements

- **Real-Time To-Do Persistence:** Save the To-Dos directly to Firebase Firestore (currently they are kept in local memory state per viewing session).
- **Import/Export BCF Files:** Enable standard BIM Collaboration Format (BCF) output to share issues with native CAD environments like Revit or Archicad.
- **Multiple Models Comparison:** Add support for overlaying structural, architectural, and MEP (Mechanical, Electrical, Plumbing) models simultaneously in the world viewport.
