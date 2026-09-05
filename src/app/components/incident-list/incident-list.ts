import { Component, OnInit, AfterViewInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IncidentService } from '../../services/incident';
import { Incident } from '../../models/incident.model';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

declare var lucide: any;

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './incident-list.html',
})
export class IncidentListComponent implements OnInit, AfterViewInit {
  incidents = signal<Incident[]>([]);
  isFetching = signal<boolean>(true);
  loadingStates = signal<Record<string, boolean>>({});

  selectedIncident = signal<Incident | null>(null);

  // Server-Side States
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('ALL');
  selectedServices = signal<Set<string>>(new Set());

  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(20); // Fetches 20 items per API call
  totalItems = signal<number>(0);
  totalPages = signal<number>(1);

  serviceCounts = signal<{ name: string; count: number }[]>([]);
  deployments = signal<any[]>([]);

  projectName = signal<string>(environment.projectName);
  private searchSubject = new Subject<string>();

  errorsPerMinute = computed(() => {
    const total = this.totalItems();
    return total > 0 ? (total / 60).toFixed(2) : '0';
  });

  startIndex = computed(() =>
    this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1,
  );
  endIndex = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.fetchIncidents();

    // 1. Initial Load of Deployments
    this.incidentService.getDeployments().subscribe({
      next: (res) => this.deployments.set(res.data),
    });

    // 2. Listen for Live Incidents
    this.incidentService.onNewIncident(() => {
      this.fetchIncidents();
    });

    // NAYA: 3. Listen for Live GitHub Pushes (Deployments)
    this.incidentService.onNewDeployment((newCommit) => {
      // Insert the new commit at the top of the deployments array automatically
      this.deployments.update((currentDeployments) => [newCommit, ...currentDeployments]);
    });

    // 4. Handle Search Debounce
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((query) => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.fetchIncidents();
    });
  }

  // ... (All other existing methods remain identical: ngAfterViewInit, fetchIncidents, analyze, etc.)
  ngAfterViewInit(): void {
    this.reRenderIcons();
  }

  reRenderIcons() {
    setTimeout(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
  }

  fetchIncidents() {
    this.isFetching.set(true);

    const params: any = {
      page: this.currentPage(),
      limit: this.itemsPerPage(),
      status: this.selectedStatus(),
      search: this.searchQuery(),
    };

    if (this.selectedServices().size > 0) {
      params.services = Array.from(this.selectedServices()).join(',');
    }

    this.incidentService.getIncidents(params).subscribe({
      next: (response) => {
        this.incidents.set(response.data);
        this.totalItems.set(response.pagination.total);
        this.totalPages.set(response.pagination.totalPages);
        this.serviceCounts.set(response.serviceCounts);
        this.isFetching.set(false);
        this.reRenderIcons();
      },
      error: (err) => {
        console.error('API Fetch Error:', err);
        this.isFetching.set(false);
      },
    });
  }

  onServiceToggle(serviceName: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentSet = new Set(this.selectedServices());

    if (isChecked) {
      currentSet.add(serviceName);
    } else {
      currentSet.delete(serviceName);
    }

    this.selectedServices.set(currentSet);
    this.currentPage.set(1);
    this.fetchIncidents();
  }

  onStatusChange(event: Event) {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
    this.fetchIncidents();
  }

  onSearch(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.searchSubject.next(input);
  }

  analyze(id: string) {
    this.loadingStates.update((states) => ({ ...states, [id]: true }));
    this.incidentService.analyzeIncident(id).subscribe({
      next: (response) => {
        if (this.selectedIncident()?.id === id) {
          this.selectedIncident.set(response.data);
        }

        this.incidents.update((currentIncidents) =>
          currentIncidents.map((inc) => (inc.id === id ? response.data : inc)),
        );

        this.loadingStates.update((states) => ({ ...states, [id]: false }));
      },
      error: (err) => {
        console.error('AI Analysis failed:', err);
        this.loadingStates.update((states) => ({ ...states, [id]: false }));
      },
    });
  }

  selectIncident(incident: Incident) {
    this.selectedIncident.set(incident);
    this.reRenderIcons();
  }

  resolveIssue(id: string) {
    this.incidentService.resolveIncident(id).subscribe({
      next: () => {
        this.fetchIncidents();
        this.selectedIncident.set(null);
      },
      error: (err) => console.error('Failed to resolve:', err),
    });
  }

  closePanel() {
    this.selectedIncident.set(null);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.fetchIncidents();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.fetchIncidents();
    }
  }
}
