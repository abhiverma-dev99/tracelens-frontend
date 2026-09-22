import { Component, OnInit, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IncidentService } from '../../services/incident';
import { AuthService } from '../../services/auth';
import { Incident } from '../../models/incident.model';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { refreshIcons } from '../../utils/icons';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './incident-list.html',
})
export class IncidentListComponent implements OnInit, AfterViewInit, OnDestroy {
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

  projectName = signal<string>('My Project');
  ingestKey = signal<string>('');
  maskedIngestKey = computed(() => {
    const key = this.ingestKey();
    if (!key) return 'Not available';
    return key.length <= 8 ? '••••••••' : `${key.slice(0, 4)}••••${key.slice(-4)}`;
  });
  streamingIncidentId = signal<string | null>(null);
  keyCopied = signal(false);
  hasActiveFilters = computed(
    () =>
      this.searchQuery().length > 0 ||
      this.selectedStatus() !== 'ALL' ||
      this.selectedServices().size > 0,
  );
  private searchSubject = new Subject<string>();
  private analysisSub: Subscription | null = null;

  errorsPerMinute = computed(() => {
    const total = this.totalItems();
    return total > 0 ? (total / 60).toFixed(2) : '0';
  });

  startIndex = computed(() =>
    this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1,
  );
  endIndex = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  constructor(
    private incidentService: IncidentService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const project = this.auth.currentProject();
    if (project?.name) this.projectName.set(project.name);
    if (project?.ingestKey) this.ingestKey.set(project.ingestKey);
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
      refreshIcons();
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
    this.analysisSub?.unsubscribe();
    this.incidentService.stopAnalysis();
    this.loadingStates.update((states) => ({ ...states, [id]: true }));
    this.streamingIncidentId.set(id);

    const selected = this.selectedIncident();
    if (selected?.id === id) {
      this.selectedIncident.set({
        ...selected,
        aiRootCause: selected.aiRootCause || '',
        aiSolution: selected.aiSolution || '',
      });
    }

    this.analysisSub = this.incidentService.streamAnalysis(id).subscribe({
      next: (event) => {
        if (event.type === 'chunk') {
          this.appendAnalysis(id, event.section, event.text);
          return;
        }
        if (event.type === 'error') {
          console.error('AI Analysis failed:', event.message);
        }
        this.finishAnalysis(id);
      },
      error: (err) => {
        console.error('AI Analysis failed:', err);
        this.finishAnalysis(id);
      },
      complete: () => this.finishAnalysis(id),
    });
  }

  copyIngestKey() {
    const key = this.ingestKey();
    if (!key || !navigator.clipboard) return;
    void navigator.clipboard.writeText(key).then(() => {
      this.keyCopied.set(true);
      setTimeout(() => this.keyCopied.set(false), 1500);
    });
  }

  private appendAnalysis(id: string, section: 'rootCause' | 'solution', text: string) {
    const field = section === 'rootCause' ? 'aiRootCause' : 'aiSolution';
    const current = this.selectedIncident();
    if (current?.id === id) {
      this.selectedIncident.set({
        ...current,
        [field]: `${current[field] || ''}${text}`,
      });
    }

    this.incidents.update((items) =>
      items.map((incident) =>
        incident.id === id
          ? { ...incident, [field]: `${incident[field] || ''}${text}` }
          : incident,
      ),
    );
  }

  private finishAnalysis(id: string) {
    this.loadingStates.update((states) => ({ ...states, [id]: false }));
    if (this.streamingIncidentId() === id) this.streamingIncidentId.set(null);
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
    this.incidentService.stopAnalysis();
    this.analysisSub?.unsubscribe();
    this.streamingIncidentId.set(null);
    this.selectedIncident.set(null);
  }

  ngOnDestroy(): void {
    this.incidentService.stopAnalysis();
    this.analysisSub?.unsubscribe();
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
