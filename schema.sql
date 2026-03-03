--
-- PostgreSQL database dump
--


-- Dumped from database version 14.20 (Ubuntu 14.20-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.20 (Ubuntu 14.20-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: daily_tasks; Type: TABLE; Schema: public; Owner: ishita
--

CREATE TABLE public.daily_tasks (
    id integer NOT NULL,
    subject_id integer,
    topic character varying(255) NOT NULL,
    scheduled_date date NOT NULL,
    completed boolean DEFAULT false,
    missed boolean DEFAULT false,
    google_event_id character varying(255)
);



--
-- Name: daily_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: ishita
--

CREATE SEQUENCE public.daily_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: daily_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ishita
--

ALTER SEQUENCE public.daily_tasks_id_seq OWNED BY public.daily_tasks.id;


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: ishita
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    topics text[] NOT NULL,
    deadline date NOT NULL
);



--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: ishita
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ishita
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: daily_tasks id; Type: DEFAULT; Schema: public; Owner: ishita
--

ALTER TABLE ONLY public.daily_tasks ALTER COLUMN id SET DEFAULT nextval('public.daily_tasks_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: ishita
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: daily_tasks daily_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: ishita
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: ishita
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: daily_tasks daily_tasks_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ishita
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

