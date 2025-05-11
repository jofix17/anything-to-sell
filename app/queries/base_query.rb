class BaseQuery
  attr_reader :params, :relation

  def initialize(params = {}, relation = nil)
    @params = params
    @relation = relation || default_relation
  end

  def execute
    # To be implemented by subclasses
    raise NotImplementedError, "Subclasses must implement #execute"
  end

  private

  def default_relation
    # To be implemented by subclasses
    raise NotImplementedError, "Subclasses must implement #default_relation"
  end
end
