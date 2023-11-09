import { FindAllArgs, IService } from '../interfaces';
import { CreateAttendanceLogDTO, UpdateAttendanceLogDTO } from '../models/dtos';
import { AttendanceLogRepository } from '../models/repositories';

export class AttendanceLogService implements Omit<IService, 'list'> {
  private attendanceLogRepository = new AttendanceLogRepository();

  async create(data: CreateAttendanceLogDTO) {
    const attendanceLog = await this.attendanceLogRepository.create(data);

    return attendanceLog;
  }

  async update(guid: string, data: UpdateAttendanceLogDTO) {
    const updatedAttendanceLog = await this.attendanceLogRepository.update(
      guid,
      data
    );

    return updatedAttendanceLog;
  }

  async list(
    args: FindAllArgs & { periodGuid: string; disciplineGuid: string }
  ) {
    const result = await this.attendanceLogRepository.findAll(
      args,
      args.periodGuid,
      args.disciplineGuid
    );

    return result;
  }

  async findByGuid(guid: string) {
    const result = await this.attendanceLogRepository.findByGuid(guid);

    return result;
  }
}
