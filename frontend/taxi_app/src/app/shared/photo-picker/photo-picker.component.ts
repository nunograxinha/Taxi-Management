import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { processProfilePhotoFile } from '../../appServices/photo-upload.util';

@Component({
  selector: 'app-photo-picker',
  templateUrl: './photo-picker.component.html',
  styleUrls: ['./photo-picker.component.css']
})
export class PhotoPickerComponent {
  @Input() photo: string | null | undefined = null;
  @Input() label = 'Profile Photo';
  @Input() hint = 'Optional · JPG, PNG or WebP';
  @Input() fallbackIcon = 'person';
  @Input() disabled = false;

  @Output() photoChange = new EventEmitter<string | null>();

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  isProcessing = false;
  errorMessage = '';

  openFilePicker(): void {
    if (this.disabled || this.isProcessing) return;
    this.errorMessage = '';
    this.fileInput?.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.errorMessage = '';
    this.isProcessing = true;
    try {
      const processed = await processProfilePhotoFile(file);
      this.photo = processed;
      this.photoChange.emit(processed);
    } catch (err: any) {
      this.errorMessage = err?.message || 'Could not process image.';
    } finally {
      this.isProcessing = false;
    }
  }

  removePhoto(): void {
    if (this.disabled || this.isProcessing) return;
    this.errorMessage = '';
    this.photo = null;
    this.photoChange.emit(null);
  }
}
