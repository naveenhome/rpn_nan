import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CalculatorApiService } from './calculator-api.service';
import { SUPPORTED_OPERATORS } from './supported-operators';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly api = inject(CalculatorApiService);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('exprInput');

  protected readonly operators = SUPPORTED_OPERATORS;
  protected readonly expression = new FormControl('', { nonNullable: true });
  protected readonly form = new FormGroup({ expression: this.expression });
  protected readonly result = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  /** Append an operator to the expression, then return focus to the input. */
  protected insert(symbol: string): void {
    const current = this.expression.value.trimEnd();
    this.expression.setValue((current ? `${current} ` : '') + `${symbol} `);
    this.input()?.nativeElement.focus();
  }

  protected evaluate(): void {
    const expression = this.expression.value.trim();
    this.error.set(null);
    this.busy.set(true);
    this.api.calculate(expression).subscribe({
      next: (res) => {
        this.result.set(res.result);
        this.busy.set(false);
      },
      error: (e: Error) => {
        this.result.set(null);
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
