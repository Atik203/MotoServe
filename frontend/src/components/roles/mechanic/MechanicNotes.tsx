"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreVertical, Save } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { addJobNote } from "@/store/slices/jobsSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { JobNote } from "@/types";

interface MechanicNotesProps {
  jobId: string;
  notes: JobNote[];
  author: string;
}

export function MechanicNotes({ jobId, notes, author }: MechanicNotesProps) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState("");

  const saveNote = async () => {
    if (!draft.trim()) return;
    try {
      await dispatch(addJobNote({ id: jobId, author, text: draft.trim() })).unwrap();
      setDraft("");
      toast.success("Note saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save note");
    }
  };

  return (
    <section className="flex flex-col gap-[8px] rounded-[8px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <h2 className="flex items-center gap-[8px] text-[16px] font-medium text-foreground">
        <Save className="size-[16px]" />
        Mechanic Notes
      </h2>

      <div className="flex flex-col gap-[8px]">
        {notes.map((note) => (
          <div key={note.id} className="flex flex-col gap-[4px] rounded-[4px] border border-border bg-secondary p-[9px]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">{note.time}</span>
              <MoreVertical className="size-[10.5px] text-muted-foreground" />
            </div>
            <p className="text-[14px] leading-[22px] text-foreground">{note.text}</p>
          </div>
        ))}
      </div>

      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Enter detailed repair notes, diagnostic findings, or specific procedures followed..."
        className="h-[136px] resize-none rounded-[4px] border-[#c2c6d5] bg-[#f8f9fa]"
      />

      <div className="flex justify-end pt-[7px]">
        <Button onClick={saveNote} className="gap-[4px] rounded-[4px] px-[16px] py-[6px]">
          <Save className="size-[13.5px]" />
          Save Note
        </Button>
      </div>
    </section>
  );
}
