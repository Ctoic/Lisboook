"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { MailIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { CONTACT_EMAIL } from "@/lib/site";

const topics = ["General question", "Suggest a book", "Report a problem", "Partnership"];

type Fields = { name: string; email: string; topic: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (fields.name.trim().length < 2) errors.name = "Tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = "Enter a valid email so we can reply.";
  if (fields.message.trim().length < 10) errors.message = "A few more words, please (at least 10 characters).";
  return errors;
}

export function ContactForm() {
  const [fields, setFields] = useState<Fields>({ name: "", email: "", topic: topics[0], message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const update = (key: keyof Fields) => (event: { target: { value: string } }) => {
    setFields((current) => ({ ...current, [key]: event.target.value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  // There is no contact endpoint yet, so the message is handed to the visitor's mail app.
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(`contact-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    const subject = `[Lisbook] ${fields.topic} — ${fields.name.trim()}`;
    const body = `${fields.message.trim()}\n\n— ${fields.name.trim()} (${fields.email.trim()})`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  const field = (key: keyof Fields) => ({
    id: `contact-${key}`,
    value: fields[key],
    onChange: update(key),
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `contact-${key}-error` : undefined
  });

  const error = (key: keyof Fields) =>
    errors[key] ? (
      <span id={`contact-${key}-error`} className="field__error">
        {errors[key]}
      </span>
    ) : null;

  return (
    <>
      <form className="glass glass--pad sheen" onSubmit={onSubmit} noValidate>
        <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>Send us a message</h2>
        <p className="muted" style={{ marginBottom: 24 }}>
          Fill this in and we&apos;ll open your email app with everything ready to send.
        </p>
        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor="contact-name">
              Your name
            </label>
            <input className="input" autoComplete="name" placeholder="Jane Reader" {...field("name")} />
            {error("name")}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="contact-email">
              Email
            </label>
            <input className="input" type="email" autoComplete="email" placeholder="you@example.com" {...field("email")} />
            {error("email")}
          </div>
          <div className="field field--full">
            <label className="field__label" htmlFor="contact-topic">
              Topic
            </label>
            <select className="input" {...field("topic")}>
              {topics.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
          </div>
          <div className="field field--full">
            <label className="field__label" htmlFor="contact-message">
              Message
            </label>
            <textarea className="input" placeholder="How can we help?" rows={6} {...field("message")} />
            {error("message")}
          </div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 24 }}>
          <Button type="submit" variant="primary" size="lg">
            <MailIcon size={18} /> Send message
          </Button>
        </div>
      </form>

      <Modal
        open={sent}
        onClose={() => setSent(false)}
        icon={<MailIcon size={24} />}
        title="Almost there"
        description={
          <>
            Your email app should now be open with the message ready — just hit send. Didn&apos;t open? Write to us at{" "}
            <a className="text-accent" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </>
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setFields({ name: "", email: "", topic: topics[0], message: "" });
                setSent(false);
              }}
            >
              Start a new message
            </Button>
            <Button variant="primary" onClick={() => setSent(false)} data-autofocus>
              Done
            </Button>
          </>
        }
      />
    </>
  );
}
