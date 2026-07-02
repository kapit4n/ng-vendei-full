# Angular Exams Module — Implementation Plan

## Overview

Add a new module to `ng-vendei-full` for practicing Angular knowledge through exams. The module allows creating and taking exams with single/multi-select questions about Angular, categorized by complexity levels.

## Architecture

### Data Storage — `localStorage`

Since there's no backend for this feature, all data persists in `localStorage` wrapped in injectable Angular services. This keeps the module self-contained without requiring backend changes.

### Route Structure

| Route | Component | Purpose |
|---|---|---|
| `/angular/questions` | `AngQuestionsComponent` | List all questions (CRUD) |
| `/angular/questions/new` | `AngQuestionFormComponent` | Create a question |
| `/angular/questions/:id` | `AngQuestionFormComponent` | Edit a question |
| `/angular/exams` | `AngExamsComponent` | List all exams & results |
| `/angular/exams/new` | `AngExamFormComponent` | Create exam (select questions randomly) |
| `/angular/exams/take/:id` | `AngExamTakeComponent` | Take an exam |
| `/angular/exams/result/:id` | `AngExamResultComponent` | View exam result |

### Service Layer

| Service | Responsibility |
|---|---|
| `AngQuestionService` | CRUD for questions, stored in localStorage |
| `AngExamService` | CRUD for exams, random question selection, scoring, stored in localStorage |

### Data Models

**Question:**
```ts
interface AngQuestion {
  id: string;
  text: string;
  options: AngQuestionOption[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

interface AngQuestionOption {
  text: string;
  correct: boolean;
}
```

**Exam:**
```ts
interface AngExam {
  id: string;
  title: string;
  questionIds: string[];
  createdAt: string;
}

interface AngExamResult {
  id: string;
  examId: string;
  examTitle: string;
  answers: AngExamAnswer[];
  score: number;
  total: number;
  completedAt: string;
}

interface AngExamAnswer {
  questionId: string;
  questionText: string;
  selectedOptions: number[];  // indices
  correctOptions: number[];   // indices
  isCorrect: boolean;
}
```

## Components

### 1. `AngQuestionsComponent` — Question List
- Table displaying all questions with columns: text (truncated), complexity badge, actions
- Filter by complexity (basic/intermediate/advanced/all)
- Search by question text
- "New Question" button → `/angular/questions/new`
- Edit/Delete actions per row

### 2. `AngQuestionFormComponent` — Question Create/Edit
- Reactive form with fields:
  - Question text (textarea, required)
  - Complexity select (basic/intermediate/advanced, required)
  - Options list (dynamic, at least 2):
    - Option text (input, required)
    - Correct checkbox (single or multi-select)
  - Explanation (textarea)
- Form validation
- Save to localStorage via service

### 3. `AngExamsComponent` — Exam List & Results
- Two tabs: "Exams" and "Results"
- **Exams tab**: list of created exams with "Take exam" button, delete action
- **Results tab**: list of completed exam results with score, date, "View" action
- "New Exam" button → `/angular/exams/new`

### 4. `AngExamFormComponent` — Create Exam
- Form fields:
  - Exam title (input, required)
  - Complexity filter (select: all/basic/intermediate/advanced)
  - Number of questions (input, number)
- On submit:
  - Filter questions by selected complexity (or all)
  - Randomly select N questions from the filtered pool
  - Display preview of selected questions
  - Save exam with selected question IDs

### 5. `AngExamTakeComponent` — Take Exam
- Load exam by ID, show all questions
- Each question shows:
  - Question text
  - Options as radio buttons (single correct) or checkboxes (multiple correct)
  - Based on the question's correct answer count
- Progress indicator (question X of Y)
- Submit button → calculate score, save result, navigate to result page

### 6. `AngExamResultComponent` — Exam Result
- Show score (X/Y correct, percentage)
- Per-question breakdown:
  - Question text
  - User's selected answers (marked correct/incorrect)
  - Correct answers highlighted
  - Explanation shown
- "Back to Exams" button

## Integration with Existing App

### Main Hub
Add a new section "Angular Practice" to the `MainComponent` hub with tiles for:
- **Questions** → `/angular/questions`
- **Exams** → `/angular/exams`

### App Module
- Register all new components in `AppModule`
- Add routes under the `/angular` prefix
- Use existing Material modules already imported (MatInput, MatButton, MatCard, MatSelect, MatTable, MatCheckbox, etc.)
- Add `MatRadioModule` to imports (needed for single-select questions)
- Add `MatChipsModule` for complexity badges (or use simple CSS)

### localStorage Keys
- `ang_questions` — JSON array of questions
- `ang_exams` — JSON array of exams
- `ang_exam_results` — JSON array of results

## Angular Features Practiced

| Feature | Where Used |
|---|---|
| Reactive Forms | Question form, Exam form |
| Form Validation | Question form, Exam form |
| Dynamic Form Controls (FormArray) | Question options list |
| Routing & Route Params | All pages |
| *ngFor / @for | Lists, options, questions in exam |
| *ngIf / @if | Conditional rendering |
| Pipes | Date formatting, truncation |
| Services (DI) | All data access |
| localStorage | Data persistence |
| OnPush change detection | Exam take (performance) |
| TrackBy | Lists for performance |
| Angular Material | All UI components |
| TypeScript interfaces | Data models |

## Implementation Order

1. Create data models (`src/app/utils/ang-models.ts`)
2. Create services (`AngQuestionService`, `AngExamService`)
3. Create `AngQuestionsComponent` (list + CRUD)
4. Create `AngQuestionFormComponent` (create/edit form)
5. Create `AngExamsComponent` (exam list + results tabs)
6. Create `AngExamFormComponent` (create exam with random selection)
7. Create `AngExamTakeComponent` (take exam)
8. Create `AngExamResultComponent` (view result)
9. Add routes to `AppModule`
10. Add hub tiles to `MainComponent`
11. Import any missing Material modules
