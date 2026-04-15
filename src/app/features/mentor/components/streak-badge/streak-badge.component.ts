import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MentorApiService } from '../../services/mentor-api.service';
import { StreakResponseDto } from '../../models/mentor.models';

@Component({
  selector: 'app-streak-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './streak-badge.component.html',
  styleUrl: './streak-badge.component.css',
})
export class StreakBadgeComponent implements OnInit {
  streak: StreakResponseDto | null = null;

  constructor(private api: MentorApiService) {}

  ngOnInit(): void {
    this.api.getStreak().subscribe({
      next: s => { this.streak = s; },
      error: () => {},
    });
  }
}
