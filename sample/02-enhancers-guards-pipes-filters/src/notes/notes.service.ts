import { Injectable } from '@nestjs/common';

export interface Note {
  id: number;
  text: string;
  createdByRequestId: string;
}

@Injectable()
export class NotesService {
  private readonly notes: Note[] = [
    { id: 1, text: 'hello world', createdByRequestId: 'seed' },
  ];
  private nextId = 2;

  list() {
    return [...this.notes];
  }

  search(query: string) {
    const q = query.toLowerCase();
    return this.notes.filter(note => note.text.toLowerCase().includes(q));
  }

  create(text: string, requestId: string) {
    const note = { id: this.nextId++, text, createdByRequestId: requestId };
    this.notes.push(note);
    return note;
  }
}
