import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-embed-panel',
  imports: [],
  templateUrl: './embed-panel.component.html',
  styleUrl: './embed-panel.component.css',
})
export class EmbedPanelComponent {
  heading = input.required<string>();
  code = input.required<string>();
  codeOpen = input(false);
  codeToggled = output<void>();
}
