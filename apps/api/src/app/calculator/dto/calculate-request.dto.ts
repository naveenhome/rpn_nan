import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CalculateRequest } from '@rpn/shared-types';

export class CalculateRequestDto implements CalculateRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  expression!: string;
}
