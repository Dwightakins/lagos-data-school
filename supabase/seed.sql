-- ============================================================
-- Lagos Data School — Course Seed Data
-- Run this in Supabase SQL Editor AFTER both migrations.
-- Safe to re-run (uses ON CONFLICT DO NOTHING).
-- ============================================================

-- ─── COURSES ─────────────────────────────────────────────────

INSERT INTO public.courses (id, title, slug, description, price, cover_image_url, published)
VALUES

  ('c0000000-0000-0000-0000-000000000001',
   'Data Analytics with Excel, SQL & Power BI',
   'data-analytics',
   'Master the full data analytics toolkit used by top Nigerian companies. Learn to clean, analyse, and visualise data using Microsoft Excel, SQL, and Power BI — then build dashboards that drive real business decisions.',
   120000, NULL, true),


  ('c0000000-0000-0000-0000-000000000002',
   'Machine Learning with Python',
   'machine-learning',
   'Go from beginner to 
   job-ready ML engineer. Cover the complete pipeline — data wrangling, feature engineering, model training, evaluation, and deployment — using Python, scikit-learn, and TensorFlow.',
   180000, NULL, true),

  ('c0000000-0000-0000-0000-000000000003',
   'Full-Stack Software Engineering',
   'software-engineering',
   'Build production-grade web applications from scratch. Learn HTML/CSS, JavaScript, React, Node.js, and PostgreSQL. Ship real projects and build a portfolio that gets you hired at top African tech companies.',
   200000, NULL, true),

  ('c0000000-0000-0000-0000-000000000004',
   'Data Engineering & Pipelines',
   'data-engineering',
   'Design and build scalable data pipelines. Covers Python, Apache Airflow, dbt, cloud storage (AWS/GCP), and modern lakehouse architectures used at Africa''s most data-driven companies.',
   160000, NULL, true),

  ('c0000000-0000-0000-0000-000000000005',
   'Python Programming for Beginners',
   'python-programming',
   'The fastest way to learn Python from scratch — no prior coding experience needed. Covers core syntax, data structures, OOP, file handling, and practical mini-projects that build real coding confidence.',
   80000, NULL, true),

  ('c0000000-0000-0000-0000-000000000006',
   'SQL & Database Fundamentals',
   'sql-database',
   'Become fluent in SQL — the most in-demand data skill in Nigeria. Learn querying, joins, aggregations, window functions, and database design using PostgreSQL. Includes hands-on projects with real datasets.',
   90000, NULL, true)

ON CONFLICT (id) DO NOTHING;


-- ─── MODULES: Data Analytics ─────────────────────────────────

INSERT INTO public.modules (id, course_id, title, description, order_index) VALUES
  ('m0010001-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000001', 'Excel for Data Analysis',       'Clean, transform, and summarise data using Excel formulas, PivotTables, and charts.',     1),
  ('m0010002-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000001', 'SQL Querying & Databases',       'Write queries to extract insights from relational databases using PostgreSQL.',             2),
  ('m0010003-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000001', 'Power BI Dashboards',           'Connect data sources, model relationships, and build interactive business dashboards.',     3),
  ('m0010004-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000001', 'Capstone Analytics Project',    'Apply everything you have learned to a real business dataset and present your findings.',   4)
ON CONFLICT (id) DO NOTHING;

-- ─── LESSONS: Data Analytics ─────────────────────────────────

INSERT INTO public.lessons (id, module_id, title, content, duration_minutes, order_index) VALUES
  -- Excel
  ('l0010101-0000-0000-0000-000000000000', 'm0010001-0000-0000-0000-000000000000', 'Introduction to Excel for Analysts',       'Overview of the Excel interface, ribbons, and the data analyst mindset.',          8,  1),
  ('l0010102-0000-0000-0000-000000000000', 'm0010001-0000-0000-0000-000000000000', 'Data Cleaning with Formulas',              'Using TRIM, CLEAN, TEXT, IFERROR, and VLOOKUP to fix messy datasets.',           12, 2),
  ('l0010103-0000-0000-0000-000000000000', 'm0010001-0000-0000-0000-000000000000', 'PivotTables & PivotCharts',                'Summarise thousands of rows in seconds and build dynamic charts.',                10, 3),
  ('l0010104-0000-0000-0000-000000000000', 'm0010001-0000-0000-0000-000000000000', 'Excel Dashboard Basics',                  'Build an interactive one-page dashboard with slicers and conditional formatting.',  14, 4),
  -- SQL
  ('l0010201-0000-0000-0000-000000000000', 'm0010002-0000-0000-0000-000000000000', 'SQL Fundamentals: SELECT & WHERE',         'Your first queries — selecting columns, filtering rows, and sorting results.',       10, 1),
  ('l0010202-0000-0000-0000-000000000000', 'm0010002-0000-0000-0000-000000000000', 'Joins: Combining Multiple Tables',         'INNER JOIN, LEFT JOIN, and how to think about relational data.',                  12, 2),
  ('l0010203-0000-0000-0000-000000000000', 'm0010002-0000-0000-0000-000000000000', 'Aggregations & GROUP BY',                 'COUNT, SUM, AVG, MAX/MIN and the art of grouping data for summaries.',            10, 3),
  ('l0010204-0000-0000-0000-000000000000', 'm0010002-0000-0000-0000-000000000000', 'Subqueries & CTEs',                       'Write readable, complex queries with Common Table Expressions.',                   14, 4),
  -- Power BI
  ('l0010301-0000-0000-0000-000000000000', 'm0010003-0000-0000-0000-000000000000', 'Connecting Data Sources in Power BI',     'Import Excel, CSV, and SQL databases into Power BI Desktop.',                     8,  1),
  ('l0010302-0000-0000-0000-000000000000', 'm0010003-0000-0000-0000-000000000000', 'Data Modelling & Relationships',          'Build star schemas and define table relationships for accurate analysis.',         12, 2),
  ('l0010303-0000-0000-0000-000000000000', 'm0010003-0000-0000-0000-000000000000', 'DAX Fundamentals',                        'Write DAX measures for dynamic calculations like YoY growth and running totals.',  15, 3),
  ('l0010304-0000-0000-0000-000000000000', 'm0010003-0000-0000-0000-000000000000', 'Publishing & Sharing Dashboards',         'Publish to Power BI Service and share dashboards with stakeholders.',             10, 4),
  -- Capstone
  ('l0010401-0000-0000-0000-000000000000', 'm0010004-0000-0000-0000-000000000000', 'Capstone Brief & Dataset Walkthrough',    'Understanding the business problem and exploring the provided dataset.',           10, 1),
  ('l0010402-0000-0000-0000-000000000000', 'm0010004-0000-0000-0000-000000000000', 'Analysis & Insight Generation',           'Applying SQL and Excel to extract key business insights.',                        20, 2),
  ('l0010403-0000-0000-0000-000000000000', 'm0010004-0000-0000-0000-000000000000', 'Building the Final Dashboard',            'Creating the Power BI capstone dashboard.',                                       20, 3),
  ('l0010404-0000-0000-0000-000000000000', 'm0010004-0000-0000-0000-000000000000', 'Presenting Your Findings',                'How to communicate data insights to a non-technical audience.',                   10, 4)
ON CONFLICT (id) DO NOTHING;


-- ─── MODULES: Machine Learning ────────────────────────────────

INSERT INTO public.modules (id, course_id, title, description, order_index) VALUES
  ('m0020001-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000002', 'Python & Data Wrangling',         'Pandas, NumPy, and Matplotlib for data manipulation and exploration.',                  1),
  ('m0020002-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000002', 'Machine Learning Fundamentals',   'Supervised and unsupervised learning algorithms using scikit-learn.',                   2),
  ('m0020003-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000002', 'Deep Learning with TensorFlow',   'Neural networks, CNNs, and fine-tuning pre-trained models.',                            3),
  ('m0020004-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000002', 'Model Deployment',               'Serving ML models via FastAPI and deploying to the cloud.',                             4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons (id, module_id, title, content, duration_minutes, order_index) VALUES
  -- Python & Data Wrangling
  ('l0020101-0000-0000-0000-000000000000', 'm0020001-0000-0000-0000-000000000000', 'Python Recap for ML',                     'Key Python concepts every ML engineer must know.',                                10, 1),
  ('l0020102-0000-0000-0000-000000000000', 'm0020001-0000-0000-0000-000000000000', 'Data Manipulation with Pandas',           'Loading, filtering, grouping, and merging DataFrames.',                          14, 2),
  ('l0020103-0000-0000-0000-000000000000', 'm0020001-0000-0000-0000-000000000000', 'Exploratory Data Analysis (EDA)',         'Visualising distributions, correlations, and outliers with Matplotlib/Seaborn.',  12, 3),
  ('l0020104-0000-0000-0000-000000000000', 'm0020001-0000-0000-0000-000000000000', 'Feature Engineering',                    'Creating new features, encoding categoricals, and scaling numerical data.',       14, 4),
  -- ML Fundamentals
  ('l0020201-0000-0000-0000-000000000000', 'm0020002-0000-0000-0000-000000000000', 'Linear & Logistic Regression',            'The maths and intuition behind the two most fundamental ML models.',             12, 1),
  ('l0020202-0000-0000-0000-000000000000', 'm0020002-0000-0000-0000-000000000000', 'Decision Trees & Random Forests',         'Ensemble methods that power many real-world classification tasks.',               12, 2),
  ('l0020203-0000-0000-0000-000000000000', 'm0020002-0000-0000-0000-000000000000', 'Model Evaluation & Cross-Validation',     'Accuracy, precision, recall, F1, AUC-ROC, and how to choose the right metric.',  12, 3),
  ('l0020204-0000-0000-0000-000000000000', 'm0020002-0000-0000-0000-000000000000', 'Hyperparameter Tuning',                  'Grid search and Bayesian optimisation to squeeze more performance.',              10, 4),
  -- Deep Learning
  ('l0020301-0000-0000-0000-000000000000', 'm0020003-0000-0000-0000-000000000000', 'Introduction to Neural Networks',         'Neurons, layers, activation functions, backpropagation.',                        14, 1),
  ('l0020302-0000-0000-0000-000000000000', 'm0020003-0000-0000-0000-000000000000', 'Building Models with TensorFlow/Keras',   'Sequential and Functional API for building deep learning models.',                14, 2),
  ('l0020303-0000-0000-0000-000000000000', 'm0020003-0000-0000-0000-000000000000', 'Transfer Learning',                      'Fine-tune pre-trained models like ResNet and BERT for your task.',                12, 3),
  -- Deployment
  ('l0020401-0000-0000-0000-000000000000', 'm0020004-0000-0000-0000-000000000000', 'Saving & Loading Models',                 'Pickle, joblib, and TensorFlow SavedModel formats.',                             8,  1),
  ('l0020402-0000-0000-0000-000000000000', 'm0020004-0000-0000-0000-000000000000', 'Serving Predictions with FastAPI',        'Build a REST API that serves ML predictions in real time.',                      14, 2),
  ('l0020403-0000-0000-0000-000000000000', 'm0020004-0000-0000-0000-000000000000', 'Deploying to the Cloud',                 'Deploy your ML API to AWS EC2 or Google Cloud Run.',                             12, 3)
ON CONFLICT (id) DO NOTHING;


-- ─── MODULES: Full-Stack Software Engineering ─────────────────

INSERT INTO public.modules (id, course_id, title, description, order_index) VALUES
  ('m0030001-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'HTML, CSS & JavaScript',         'Build the web from scratch — structure, style, and interactivity.',                     1),
  ('m0030002-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'React Frontend Development',     'Build component-based UIs with React hooks, state management, and routing.',          2),
  ('m0030003-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'Node.js & REST APIs',            'Build and secure REST APIs with Express.js, JWT auth, and PostgreSQL.',               3),
  ('m0030004-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'Deployment & DevOps Basics',     'Git, CI/CD, Docker basics, and deploying full-stack apps to production.',              4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons (id, module_id, title, content, duration_minutes, order_index) VALUES
  -- HTML/CSS/JS
  ('l0030101-0000-0000-0000-000000000000', 'm0030001-0000-0000-0000-000000000000', 'HTML Structure & Semantics',              'Writing clean, accessible HTML5 — headings, sections, forms.',                    10, 1),
  ('l0030102-0000-0000-0000-000000000000', 'm0030001-0000-0000-0000-000000000000', 'CSS Layouts: Flexbox & Grid',             'Building responsive layouts with modern CSS without frameworks.',                 14, 2),
  ('l0030103-0000-0000-0000-000000000000', 'm0030001-0000-0000-0000-000000000000', 'JavaScript Fundamentals',                 'Variables, functions, arrays, objects, async/await.',                             15, 3),
  ('l0030104-0000-0000-0000-000000000000', 'm0030001-0000-0000-0000-000000000000', 'DOM Manipulation & Events',               'Updating the page dynamically — event listeners, fetch API.',                    12, 4),
  -- React
  ('l0030201-0000-0000-0000-000000000000', 'm0030002-0000-0000-0000-000000000000', 'React Fundamentals & JSX',                'Components, props, state, and the React mental model.',                          12, 1),
  ('l0030202-0000-0000-0000-000000000000', 'm0030002-0000-0000-0000-000000000000', 'Hooks: useState, useEffect, useContext',   'Managing side effects and shared state in functional components.',                14, 2),
  ('l0030203-0000-0000-0000-000000000000', 'm0030002-0000-0000-0000-000000000000', 'React Router & Navigation',               'Multi-page applications with React Router v6.',                                  10, 3),
  ('l0030204-0000-0000-0000-000000000000', 'm0030002-0000-0000-0000-000000000000', 'Fetching Data & API Integration',         'Calling REST APIs from React and handling loading/error states.',                12, 4),
  -- Node.js
  ('l0030301-0000-0000-0000-000000000000', 'm0030003-0000-0000-0000-000000000000', 'Node.js & Express Basics',                'Setting up a server, routing, middleware, and error handling.',                  12, 1),
  ('l0030302-0000-0000-0000-000000000000', 'm0030003-0000-0000-0000-000000000000', 'PostgreSQL & Prisma ORM',                 'Database schema design, migrations, and querying with Prisma.',                  14, 2),
  ('l0030303-0000-0000-0000-000000000000', 'm0030003-0000-0000-0000-000000000000', 'JWT Authentication',                     'Implementing signup, login, and protected routes with JSON Web Tokens.',         12, 3),
  -- Deployment
  ('l0030401-0000-0000-0000-000000000000', 'm0030004-0000-0000-0000-000000000000', 'Git & GitHub for Teams',                  'Branching, pull requests, code reviews, and resolving merge conflicts.',         10, 1),
  ('l0030402-0000-0000-0000-000000000000', 'm0030004-0000-0000-0000-000000000000', 'Deploying to Vercel & Render',            'Frontend on Vercel, backend on Render — complete full-stack deploy.',            12, 2),
  ('l0030403-0000-0000-0000-000000000000', 'm0030004-0000-0000-0000-000000000000', 'Docker for Developers',                  'Containerise your app so it runs the same everywhere.',                          10, 3)
ON CONFLICT (id) DO NOTHING;


-- ─── MODULES: Data Engineering ────────────────────────────────

INSERT INTO public.modules (id, course_id, title, description, order_index) VALUES
  ('m0040001-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000004', 'Python for Data Engineering',    'Advanced Python: file I/O, API calls, generators, and async patterns.',                 1),
  ('m0040002-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000004', 'Pipeline Orchestration',         'Design and schedule data workflows with Apache Airflow and dbt.',                       2),
  ('m0040003-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000004', 'Cloud & Lakehouse Architecture', 'AWS S3, BigQuery, Delta Lake, and building modern data stacks.',                         3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons (id, module_id, title, content, duration_minutes, order_index) VALUES
  -- Python DE
  ('l0040101-0000-0000-0000-000000000000', 'm0040001-0000-0000-0000-000000000000', 'Working with Files & APIs',               'Reading CSVs, JSONs, calling REST APIs, and writing pipeline scripts.',          12, 1),
  ('l0040102-0000-0000-0000-000000000000', 'm0040001-0000-0000-0000-000000000000', 'Data Validation with Pydantic',           'Validating and parsing incoming data with strict schemas.',                      10, 2),
  ('l0040103-0000-0000-0000-000000000000', 'm0040001-0000-0000-0000-000000000000', 'Parallel Processing & Performance',       'Threading, multiprocessing, and async IO for high-throughput pipelines.',        14, 3),
  -- Orchestration
  ('l0040201-0000-0000-0000-000000000000', 'm0040002-0000-0000-0000-000000000000', 'Apache Airflow: DAGs & Operators',        'Writing your first DAG, scheduling, retries, and monitoring.',                   14, 1),
  ('l0040202-0000-0000-0000-000000000000', 'm0040002-0000-0000-0000-000000000000', 'dbt: Transform Data in the Warehouse',    'Materialising models, writing tests, and documentation in dbt.',                 14, 2),
  ('l0040203-0000-0000-0000-000000000000', 'm0040002-0000-0000-0000-000000000000', 'Testing & Monitoring Pipelines',          'Data quality checks, alerting on failures, and SLA monitoring.',                 10, 3),
  -- Cloud
  ('l0040301-0000-0000-0000-000000000000', 'm0040003-0000-0000-0000-000000000000', 'AWS S3 & Data Lakes',                    'Organising raw, curated, and analytics-ready zones in object storage.',          12, 1),
  ('l0040302-0000-0000-0000-000000000000', 'm0040003-0000-0000-0000-000000000000', 'Google BigQuery for Analytics',           'Loading data, writing analytical SQL, and optimising costs in BigQuery.',        12, 2),
  ('l0040303-0000-0000-0000-000000000000', 'm0040003-0000-0000-0000-000000000000', 'Delta Lake & Lakehouse Patterns',         'ACID transactions on object storage with Delta, Iceberg, and Hudi.',            12, 3)
ON CONFLICT (id) DO NOTHING;


-- ─── MODULES: Python for Beginners ───────────────────────────

INSERT INTO public.modules (id, course_id, title, description, order_index) VALUES
  ('m0050001-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000005', 'Python Basics',                  'Variables, data types, operators, conditionals, and loops.',                             1),
  ('m0050002-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000005', 'Data Structures & Functions',    'Lists, dicts, sets, tuples, and writing reusable functions.',                            2),
  ('m0050003-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000005', 'OOP & Mini Projects',            'Classes, objects, and building small real-world Python applications.',                    3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons (id, module_id, title, content, duration_minutes, order_index) VALUES
  -- Basics
  ('l0050101-0000-0000-0000-000000000000', 'm0050001-0000-0000-0000-000000000000', 'Setting Up Python & Your First Script',   'Installing Python, VS Code, and running "Hello, World!".',                       8,  1),
  ('l0050102-0000-0000-0000-000000000000', 'm0050001-0000-0000-0000-000000000000', 'Variables, Types & Operators',            'Integers, floats, strings, booleans, and arithmetic.',                           10, 2),
  ('l0050103-0000-0000-0000-000000000000', 'm0050001-0000-0000-0000-000000000000', 'Conditionals & Loops',                   'if/elif/else, for loops, while loops, and break/continue.',                      12, 3),
  ('l0050104-0000-0000-0000-000000000000', 'm0050001-0000-0000-0000-000000000000', 'User Input & Basic File I/O',            'Getting input from the user and reading/writing text files.',                    10, 4),
  -- Data Structures
  ('l0050201-0000-0000-0000-000000000000', 'm0050002-0000-0000-0000-000000000000', 'Lists & List Comprehensions',            'Creating, slicing, sorting, and iterating over lists efficiently.',               10, 1),
  ('l0050202-0000-0000-0000-000000000000', 'm0050002-0000-0000-0000-000000000000', 'Dictionaries & Sets',                   'Key-value storage, lookups, and set operations for deduplication.',               10, 2),
  ('l0050203-0000-0000-0000-000000000000', 'm0050002-0000-0000-0000-000000000000', 'Writing & Calling Functions',            'Parameters, return values, default args, and *args/**kwargs.',                   12, 3),
  -- OOP
  ('l0050301-0000-0000-0000-000000000000', 'm0050003-0000-0000-0000-000000000000', 'Classes & Objects',                     'Defining classes, __init__, instance methods, and attributes.',                  12, 1),
  ('l0050302-0000-0000-0000-000000000000', 'm0050003-0000-0000-0000-000000000000', 'Inheritance & Polymorphism',             'Extending classes and overriding methods.',                                       10, 2),
  ('l0050303-0000-0000-0000-000000000000', 'm0050003-0000-0000-0000-000000000000', 'Mini Project: Budget Tracker CLI',       'Build a command-line budget tracker using everything you have learned.',          20, 3)
ON CONFLICT (id) DO NOTHING;


-- ─── MODULES: SQL Fundamentals ────────────────────────────────

INSERT INTO public.modules (id, course_id, title, description, order_index) VALUES
  ('m0060001-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000006', 'SQL Basics',                     'SELECT, WHERE, ORDER BY, LIMIT — your first real queries.',                             1),
  ('m0060002-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000006', 'Advanced SQL Querying',          'Window functions, CTEs, subqueries, and performance optimisation.',                      2),
  ('m0060003-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000006', 'Database Design',                'Normalisation, ERDs, primary/foreign keys, and schema best practices.',                   3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons (id, module_id, title, content, duration_minutes, order_index) VALUES
  -- SQL Basics
  ('l0060101-0000-0000-0000-000000000000', 'm0060001-0000-0000-0000-000000000000', 'What is SQL & Why Learn It',             'SQL''s role in data analysis, engineering, and backend development.',             8,  1),
  ('l0060102-0000-0000-0000-000000000000', 'm0060001-0000-0000-0000-000000000000', 'SELECT, FROM & WHERE',                   'Filtering rows, comparison operators, and NULL handling.',                       10, 2),
  ('l0060103-0000-0000-0000-000000000000', 'm0060001-0000-0000-0000-000000000000', 'Aggregations: COUNT, SUM, AVG',          'GROUP BY, HAVING, and computing summary statistics.',                            10, 3),
  ('l0060104-0000-0000-0000-000000000000', 'm0060001-0000-0000-0000-000000000000', 'Joins: Combining Tables',                'INNER, LEFT, RIGHT, and FULL OUTER JOIN with real examples.',                    12, 4),
  -- Advanced SQL
  ('l0060201-0000-0000-0000-000000000000', 'm0060002-0000-0000-0000-000000000000', 'Window Functions',                      'ROW_NUMBER, RANK, LEAD, LAG, and running totals — without GROUP BY.',            14, 1),
  ('l0060202-0000-0000-0000-000000000000', 'm0060002-0000-0000-0000-000000000000', 'Common Table Expressions (CTEs)',        'Breaking complex queries into readable, reusable steps with WITH.',              12, 2),
  ('l0060203-0000-0000-0000-000000000000', 'm0060002-0000-0000-0000-000000000000', 'Query Performance & Indexes',           'Reading EXPLAIN plans and adding indexes to make queries fast.',                  12, 3),
  -- DB Design
  ('l0060301-0000-0000-0000-000000000000', 'm0060003-0000-0000-0000-000000000000', 'Normalisation & Normal Forms',           '1NF, 2NF, 3NF — eliminating redundancy and update anomalies.',                  12, 1),
  ('l0060302-0000-0000-0000-000000000000', 'm0060003-0000-0000-0000-000000000000', 'Entity-Relationship Diagrams (ERDs)',    'Drawing and reading database schemas visually.',                                  10, 2),
  ('l0060303-0000-0000-0000-000000000000', 'm0060003-0000-0000-0000-000000000000', 'Capstone: Design a School Database',     'Design and build the full schema for a fictional school from scratch.',           20, 3)
ON CONFLICT (id) DO NOTHING;
