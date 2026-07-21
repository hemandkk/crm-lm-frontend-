# High-level architecture
                Upload PDFs / DOCX / TXT
                          │
                          ▼
                Document Processing
                          │
        Extract text (OCR if required)
                          │
                          ▼
                Split into chunks
                          │
                          ▼
             Create Embeddings
                          │
                          ▼
                 Vector Database
                          ▲
                          │
      User Question ---> Embed Question
                          │
                 Similarity Search
                          │
              Top 5-10 Relevant Chunks
                          │
                          ▼
                     LLM Prompt
                          │
                          ▼
                 AI Generated Answer

Tech Stack
Frontend

Next.js
Tailwind
React Query
Markdown rendering
Streaming responses (like ChatGPT)
Backend

FastAPI
Celery (optional for background indexing)
SQLAlchemy
PostgreSQL
Vector Database

Choose one:

PostgreSQL + pgvector ⭐ (recommended)
Qdrant
Pinecone
Weaviate
Chroma
Since you're already using PostgreSQL, pgvector is the best choice.

# Step 1: Upload files
User uploads

Admissions.pdf
Fees.pdf
University Rules.docx
Prospectus.pdf

Store them

uploads/
    admissions.pdf
    fee.pdf

Save metadata

documents

id
filename
uploaded_by
uploaded_at

# # Step 2: Read document
PDF

import pymupdf

doc = pymupdf.open("admission.pdf")

text = ""

for page in doc:
    text += page.get_text()

DOCX

from docx import Document

doc = Document("notes.docx")

text = "\n".join(
    p.text
    for p in doc.paragraphs
)

TXT

text = open("notes.txt").read()

# # Step 3: Chunking
Never embed an entire PDF.

Instead split into chunks.

Chunk 1
Admissions begin on June 10...

Chunk 2
MBA fee is 85,000...

Chunk 3
Eligibility is graduation...

Use

LangChain TextSplitter

or

RecursiveCharacterTextSplitter

Example

RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)

# Step 4: Create embeddings
Embedding converts text into vectors.

Example

"The MBA fee is 80,000"

↓

[0.124,
-0.567,
0.987,
....1536 numbers]

Models

OpenAI

text-embedding-3-small

or

text-embedding-3-large

Free

BAAI/bge-small-en-v1.5

or

nomic-embed-text

or

all-MiniLM-L6-v2

using SentenceTransformers.

# Step 5: Store in pgvector
Table

document_chunks

id

document_id

chunk_text

embedding VECTOR(1536)

Example

Chunk

MBA fee is 85000

Embedding

[0.13,0.55....]

# Step 6: User asks
What is MBA fee?

Convert question to embedding.

"What is MBA fee?"

↓

[0.22,0.33....]

# Step 7: Similarity search
PostgreSQL

SELECT *
FROM document_chunks
ORDER BY embedding <=> :query_vector
LIMIT 5;

Returns

MBA Fee

85,000

Registration fee

5000

Exam fee

2000

# Step 8: Build prompt
Instead of asking

What is MBA fee?

You ask the LLM

You are an admission assistant.

Use ONLY the following information.

----------------

MBA fee is 85000

Registration fee 5000

Exam fee 2000

----------------

Question:

What is MBA fee?

# Step 9: LLM response
Output

The MBA fee is ₹85,000.

Additionally,

Registration Fee : ₹5,000

Exam Fee : ₹2,000

Chat History
Keep conversation

Conversation

User

Assistant

User

Assistant

When asking again

How much is the exam fee?

send previous messages too.

Database
documents

id
name
uploaded_at

chunks

id
document_id
text
embedding
page

conversations

id
user
created_at

messages

conversation_id

role

content

Libraries
Python

LangChain

LlamaIndex

Haystack

SentenceTransformers

PyMuPDF

python-docx

pgvector

OpenAI SDK

UI
Exactly like ChatGPT

----------------------------
Chats

Admissions

HR

Finance

----------------------------

            Chat

----------------------------

User

What is MBA fee?

----------------------------

Assistant

MBA fee is 85,000.

----------------------------

Sources

Admissions.pdf Page 12

Fee.pdf Page 2

----------------------------

Showing sources builds user trust.

Useful Features
You can extend the system with:

Multi-PDF search
Folder-based knowledge bases (e.g., HR, Finance, Admissions)
OCR for scanned PDFs using Tesseract or cloud OCR services
Excel, CSV, PowerPoint, HTML, and Markdown support
Citation of page numbers and document names
Semantic caching for repeated questions
Hybrid search (keyword + vector search)
User roles and permissions
Incremental indexing when files are updated
Streaming responses
Feedback buttons (👍/👎)
Suggested follow-up questions
Multi-tenant SaaS Design
If you want multiple customers to use the same application, store a tenant identifier with every document and chunk:

Organization A
    Admissions.pdf
    Fees.pdf

Organization B
    HR Policy.pdf
    Leave Rules.pdf

Every query filters by the current organization before performing vector search, ensuring data isolation.

