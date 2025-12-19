'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';

type AcademicLevel = 'level_100' | 'level_200' | 'level_300' | 'level_400' | 'alumni' | 'student' | '400' | '300' | '200' | '100';

interface AcademicLevelDialogProps {
  user: any;
  currentLevel?: string;
  onLevelUpdate?: (newLevel: string) => void;
}

export function AcademicLevelDialog({ user, currentLevel, onLevelUpdate }: AcademicLevelDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<AcademicLevel>('400');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize the selected level based on current level
  useEffect(() => {
    if (currentLevel) {
      // Normalize level to match our select options
      const normalizedLevel = currentLevel.toLowerCase();
      if (['level_100', 'level_200', 'level_300', 'level_400', 'alumni'].includes(normalizedLevel)) {
        setSelectedLevel(normalizedLevel as AcademicLevel);
      } else if (['100', '200', '300', '400'].includes(normalizedLevel)) {
        setSelectedLevel(normalizedLevel as AcademicLevel);
      } else {
        setSelectedLevel('student');
      }
    }
  }, [currentLevel]);

  const handleUpdateLevel = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Update the user's academic level in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ academic_level: selectedLevel })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Academic level updated successfully!' });
      
      // Call the callback if provided
      if (onLevelUpdate) {
        onLevelUpdate(selectedLevel);
      }

      // Close the dialog after a short delay
      setTimeout(() => {
        setOpen(false);
      }, 1500);
    } catch (error) {
      console.error('Error updating academic level:', error);
      setMessage({ type: 'error', text: 'Failed to update academic level. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Update Academic Level</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Academic Level</DialogTitle>
          <DialogDescription>
            Select your current academic level to ensure proper access to system features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Current Level: <span className="font-semibold">{currentLevel || 'Not set'}</span>
            </label>
          </div>
          
          <div className="grid gap-4">
            <div>
              <label htmlFor="academic-level" className="text-sm font-medium text-foreground mb-2 block">
                Select New Level
              </label>
              <Select value={selectedLevel} onValueChange={(value) => setSelectedLevel(value as AcademicLevel)}>
                <SelectTrigger id="academic-level">
                  <SelectValue placeholder="Select academic level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="level_100">Level 100</SelectItem>
                  <SelectItem value="level_200">Level 200</SelectItem>
                  <SelectItem value="level_300">Level 300</SelectItem>
                  <SelectItem value="level_400">Level 400</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {message && (
              <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateLevel}
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Level'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}