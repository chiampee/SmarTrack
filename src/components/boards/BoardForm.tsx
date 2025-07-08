import React, { useState } from 'react';
import { Input, Button } from '..';
import { Board } from '../../types/Board';
import { boardService } from '../../services/boardService';

interface Props {
  initial?: Partial<Board>;
  onSuccess: () => void;
}

export const BoardForm: React.FC<Props> = ({ initial = {}, onSuccess }) => {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [color, setColor] = useState(initial.color || '#3b82f6');

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const board: Board = {
          id: crypto.randomUUID(),
          title,
          description,
          color,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await boardService.create(board);
        onSuccess();
      }}
    >
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Color</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
}; 